const express = require('express');
const router = express.Router();
const { fetchSheetData } = require('../utils/sheets');

// Cache password for 5 minutes to avoid hitting the sheet on every request
let passwordCache = { value: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

async function getCurrentPassword() {
  const now = Date.now();
  if (passwordCache.value && now - passwordCache.timestamp < CACHE_TTL) {
    return passwordCache.value;
  }

  const url = process.env.PASSWORD_SHEET_URL;
  if (!url) return null;

  const data = await fetchSheetData(url);
  const password = data?.password?.toString().trim();
  if (password) {
    passwordCache = { value: password, timestamp: now };
  }
  return password;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const currentPassword = await getCurrentPassword();
    if (!currentPassword) {
      return res.status(500).json({ error: 'Password system not configured' });
    }

    if (password.trim() === currentPassword) {
      // Generate a simple session token (valid for 24 hours)
      const token = Buffer.from(`${Date.now()}:${currentPassword}`).toString('base64');
      return res.json({ success: true, token });
    }

    res.status(401).json({ error: 'Incorrect password' });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// POST /api/auth/verify — check if token is still valid
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ valid: false });

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestamp, pwd] = decoded.split(':');
    const age = Date.now() - parseInt(timestamp, 10);

    // Token expires after 24 hours
    if (age > 24 * 60 * 60 * 1000) {
      return res.json({ valid: false, reason: 'expired' });
    }

    // Check password still matches (in case it changed)
    const currentPassword = await getCurrentPassword();
    if (pwd !== currentPassword) {
      return res.json({ valid: false, reason: 'password_changed' });
    }

    res.json({ valid: true });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
