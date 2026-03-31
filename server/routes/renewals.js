const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { computePriorityScores } = require('../utils/priority');
const { fetchSheetData, normalizeSheetData } = require('../utils/sheets');

const SNAPSHOT_PATH = path.join(__dirname, '..', 'data', 'snapshot.json');

// Cache results for 5 minutes
let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

function loadSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return null;
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
}

function saveSnapshot(scored, source) {
  const dir = path.dirname(SNAPSHOT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify({
    refreshedAt: new Date().toISOString(),
    source: source || 'google-sheets',
    count: scored.length,
    data: scored,
  }, null, 2));
}

async function fetchFromSheets() {
  const url = process.env.GOOGLE_SHEETS_URL;
  if (!url) return null;

  console.log('Fetching data from Google Sheets...');
  const sheetResponse = await fetchSheetData(url);
  const rows = normalizeSheetData(sheetResponse);
  console.log(`Fetched ${rows.length} rows from Google Sheets`);
  return rows;
}

async function fetchRenewals() {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  // Try Google Sheets first
  if (process.env.GOOGLE_SHEETS_URL) {
    try {
      const rows = await fetchFromSheets();
      if (rows && rows.length > 0) {
        const scored = computePriorityScores(rows);
        scored.sort((a, b) => b.priorityScore - a.priorityScore);
        saveSnapshot(scored, 'google-sheets');
        cache = { data: scored, timestamp: now };
        return scored;
      }
    } catch (err) {
      console.error('Google Sheets fetch failed, falling back to snapshot:', err.message);
    }
  }

  // Fallback: serve from snapshot
  const snapshot = loadSnapshot();
  if (snapshot) {
    cache = { data: snapshot.data, timestamp: now };
    return snapshot.data;
  }

  throw new Error('No data source available. Set GOOGLE_SHEETS_URL in .env');
}

// POST /api/renewals/refresh — manually trigger a refresh from Google Sheets
router.post('/refresh', async (req, res) => {
  try {
    cache = { data: null, timestamp: 0 };
    const rows = await fetchFromSheets();
    if (!rows || rows.length === 0) {
      return res.status(500).json({ error: 'No data returned from Google Sheets' });
    }
    const scored = computePriorityScores(rows);
    scored.sort((a, b) => b.priorityScore - a.priorityScore);
    saveSnapshot(scored, 'google-sheets');
    cache = { data: scored, timestamp: Date.now() };
    res.json({ message: 'Data refreshed from Google Sheets', count: scored.length, refreshedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error refreshing:', err);
    res.status(500).json({ error: 'Failed to refresh from Google Sheets' });
  }
});

// GET /api/renewals/snapshot-info
router.get('/snapshot-info', (req, res) => {
  const snapshot = loadSnapshot();
  if (!snapshot) return res.json({ exists: false });
  res.json({ exists: true, refreshedAt: snapshot.refreshedAt, source: snapshot.source, count: snapshot.count });
});

// GET /api/renewals — all renewals with priority scores
router.get('/', async (req, res) => {
  try {
    const data = await fetchRenewals();

    let filtered = data;

    if (req.query.reseller) {
      const reseller = req.query.reseller.toLowerCase();
      filtered = filtered.filter((r) =>
        r.ZUORA_ACCOUNT_NAME?.toLowerCase().includes(reseller)
      );
    }

    if (req.query.priority) {
      filtered = filtered.filter((r) => r.priorityLevel === req.query.priority);
    }

    if (req.query.days) {
      const maxDays = parseInt(req.query.days, 10);
      filtered = filtered.filter(
        (r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= maxDays
      );
    }

    res.json({ count: filtered.length, data: filtered });
  } catch (err) {
    console.error('Error fetching renewals:', err);
    res.status(500).json({ error: 'Failed to fetch renewals' });
  }
});

// GET /api/renewals/summary — aggregate stats
router.get('/summary', async (req, res) => {
  try {
    const data = await fetchRenewals();

    const totalAccounts = new Set(data.map((r) => r.RESELLERCUSTOMER_ACCOUNT_ID)).size;
    const totalArrUsd = data.reduce((sum, r) => sum + (r.arrUsd || 0), 0);

    const next30 = data.filter((r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= 30);
    const next60 = data.filter((r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= 60);
    const next90 = data.filter((r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= 90);
    const overdue = data.filter((r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= 0);

    const byPriority = {
      critical: data.filter((r) => r.priorityLevel === 'critical').length,
      high: data.filter((r) => r.priorityLevel === 'high').length,
      medium: data.filter((r) => r.priorityLevel === 'medium').length,
      low: data.filter((r) => r.priorityLevel === 'low').length,
    };

    const arrUsdNext30 = next30.reduce((sum, r) => sum + (r.arrUsd || 0), 0);
    const arrUsdNext60 = next60.reduce((sum, r) => sum + (r.arrUsd || 0), 0);
    const arrUsdNext90 = next90.reduce((sum, r) => sum + (r.arrUsd || 0), 0);

    const resellerMap = {};
    next90.forEach((r) => {
      const name = r.ZUORA_ACCOUNT_NAME || 'Unknown';
      if (!resellerMap[name]) resellerMap[name] = { name, arrUsd: 0, count: 0 };
      resellerMap[name].arrUsd += r.arrUsd || 0;
      resellerMap[name].count += 1;
    });
    const topResellers = Object.values(resellerMap)
      .sort((a, b) => b.arrUsd - a.arrUsd)
      .slice(0, 10);

    res.json({
      totalAccounts,
      totalArrUsd,
      overdue: { count: overdue.length, arrUsd: overdue.reduce((s, r) => s + (r.arrUsd || 0), 0) },
      next30: { count: next30.length, arrUsd: arrUsdNext30 },
      next60: { count: next60.length, arrUsd: arrUsdNext60 },
      next90: { count: next90.length, arrUsd: arrUsdNext90 },
      byPriority,
      topResellers,
    });
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

async function refreshSnapshot() {
  const rows = await fetchFromSheets();
  const scored = computePriorityScores(rows);
  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  saveSnapshot(scored, 'google-sheets');
  cache = { data: scored, timestamp: Date.now() };
  return scored;
}

module.exports = router;
module.exports.refreshSnapshot = refreshSnapshot;
