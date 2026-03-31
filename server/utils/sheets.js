const https = require('https');
const http = require('http');

function fetchSheetData(webAppUrl) {
  return new Promise((resolve, reject) => {
    function follow(url, redirectCount) {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));

      const mod = url.startsWith('https') ? https : http;
      mod.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location, redirectCount + 1);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Google Sheets responded with status ${res.statusCode}`));
        }

        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            reject(new Error('Failed to parse Google Sheets response'));
          }
        });
      }).on('error', reject);
    }

    follow(webAppUrl, 0);
  });
}

// Known header values to detect the real header row
const KNOWN_HEADERS = ['ZUORA_ACCOUNT_ID', 'ZUORA_ACCOUNT_NAME', 'RESELLERCUSTOMER_ARR', 'RESELLERCUSTOMER_ACCOUNTNAME'];

// Maps sheet column headers to internal field names
const COLUMN_MAP = {
  'zuora_account_id': 'ZUORA_ACCOUNT_ID',
  'zuora_account_number': 'ZUORA_ACCOUNT_NUMBER',
  'zuora_account_name': 'ZUORA_ACCOUNT_NAME',
  'zendesk_id': 'ZENDESK_ID',
  'subdomain': 'SUBDOMAIN',
  'sfdc_id': 'SFDC_ID',
  'account_type': 'ACCOUNT_TYPE',
  'reseller_region': 'RESELLER_REGION',
  'resellercustomer_account_id': 'RESELLERCUSTOMER_ACCOUNT_ID',
  'resellercustomer_accountnumber': 'RESELLERCUSTOMER_ACCOUNTNUMBER',
  'resellercustomer_accountname': 'RESELLERCUSTOMER_ACCOUNTNAME',
  'resellercustomer_zendesk_id': 'RESELLERCUSTOMER_ZENDESK_ID',
  'resellercustomer_subdomain': 'RESELLERCUSTOMER_SUBDOMAIN',
  'resellercustomer_sfdc_id': 'RESELLERCUSTOMER_SFDC_ID',
  'resellercustomer_status': 'RESELLERCUSTOMER_STATUS',
  'resellercustomer_arr': 'RESELLERCUSTOMER_ARR',
  'resellercustomer_currency': 'RESELLERCUSTOMER_CURRENCY',
  'resellercustomer_sub_id': 'RESELLERCUSTOMER_SUB_ID',
  'resellercustomer_sub_number': 'RESELLERCUSTOMER_SUB_NUMBER',
  'resellercustomer_sub_renewal_date': 'RESELLERCUSTOMER_SUB_RENEWAL_DATE',
  'resellercustomer_sub_status': 'RESELLERCUSTOMER_SUB_STATUS',
  'resellercustomer_billing_period': 'RESELLERCUSTOMER_BILLING_PERIOD',
};

function normalizeKey(key) {
  return key.toString().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function mapHeader(header) {
  const key = normalizeKey(header);
  return COLUMN_MAP[key] || header;
}

function rowToObject(rowValues, headers) {
  const obj = {};
  for (let j = 0; j < headers.length; j++) {
    if (!headers[j]) continue;
    const mappedKey = mapHeader(headers[j]);
    let val = j < rowValues.length ? rowValues[j] : '';
    if (mappedKey === 'RESELLERCUSTOMER_ARR') {
      val = parseFloat(val) || 0;
    }
    obj[mappedKey] = val;
  }
  return obj;
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    const matches = row.filter((v) =>
      typeof v === 'string' && KNOWN_HEADERS.includes(v.toUpperCase())
    );
    if (matches.length >= 2) return i;
  }
  return -1;
}

function normalizeSheetData(sheetResponse) {
  if (!sheetResponse) return [];

  // New format: raw 2D array in `rows`
  if (sheetResponse.rows && Array.isArray(sheetResponse.rows)) {
    const allRows = sheetResponse.rows;
    const headerIdx = findHeaderRow(allRows);

    if (headerIdx === -1) {
      console.warn('Could not detect header row in sheet');
      return [];
    }

    const headers = allRows[headerIdx].map((h) => (typeof h === 'string' ? h.trim() : ''));
    console.log(`Header row at index ${headerIdx}: ${headers.filter(Boolean).join(', ')}`);

    const result = [];
    for (let i = headerIdx + 1; i < allRows.length; i++) {
      const row = allRows[i];
      if (!row[0] && !row[1]) continue; // skip empty rows
      result.push(rowToObject(row, headers));
    }
    return result;
  }

  // Old format: array of objects in `data`
  if (sheetResponse.data && Array.isArray(sheetResponse.data)) {
    // Check if these are properly keyed objects
    const first = sheetResponse.data[0];
    if (!first) return [];
    const keys = Object.keys(first);
    const hasKnownKey = keys.some((k) => KNOWN_HEADERS.includes(k.toUpperCase()));

    if (hasKnownKey) {
      return sheetResponse.data.map((row) => {
        const obj = {};
        for (const [key, val] of Object.entries(row)) {
          const mappedKey = mapHeader(key);
          obj[mappedKey] = mappedKey === 'RESELLERCUSTOMER_ARR' ? (parseFloat(val) || 0) : val;
        }
        return obj;
      });
    }

    // Objects keyed by wrong header — extract values as arrays and detect
    const asArrays = sheetResponse.data.map((row) => Object.values(row));
    const headerIdx = findHeaderRow(asArrays);

    if (headerIdx === -1) {
      console.warn('Could not detect header row from object values');
      return [];
    }

    const headers = asArrays[headerIdx].map((h) => (typeof h === 'string' ? h.trim() : ''));
    console.log(`Header row at index ${headerIdx} (from objects): ${headers.filter(Boolean).join(', ')}`);

    const result = [];
    for (let i = headerIdx + 1; i < asArrays.length; i++) {
      const row = asArrays[i];
      if (!row[0] && !row[1]) continue;
      result.push(rowToObject(row, headers));
    }
    return result;
  }

  console.warn('Unknown sheet response format');
  return [];
}

module.exports = { fetchSheetData, normalizeSheetData };
