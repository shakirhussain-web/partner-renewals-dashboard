// Standalone script to refresh the snapshot from Snowflake
// Run: npm run refresh (requires Snowflake SSO credentials in .env)
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { executeQuery } = require('./snowflake');
const { computePriorityScores } = require('./utils/priority');

const RENEWALS_QUERY = fs.readFileSync(path.join(__dirname, 'routes', 'renewals.js'), 'utf-8')
  .match(/const RENEWALS_QUERY = `([\s\S]*?)`;/)?.[1];

// Re-import the query from the route file would be circular, so we inline it here
async function main() {
  console.log('Connecting to Snowflake (SSO browser will open)...');

  const query = `
WITH reseller AS (
  SELECT
    a.id AS zuora_account_id,
    a.account_number AS zuora_account_number,
    a.name AS zuora_account_name,
    TRY_CAST(a.zendesk_account_id_c AS INT) AS zendesk_id,
    z.subdomain_c AS subdomain,
    a.crm_id AS sfdc_id,
    a.account_type_c AS account_type,
    s.id AS sub_id,
    s.name AS sub_number,
    p.name AS product_name,
    rpc.name AS charge_name,
    rpc.quantity AS quantity
  FROM cleansed.zuora.zuora_accounts_bcv a
  LEFT JOIN cleansed.zuora.zuora_subscriptions_bcv s ON a.id = s.account_id
  LEFT JOIN cleansed.zuora.zuora_rate_plan_charges_bcv rpc ON s.id = rpc.subscription_id
  LEFT JOIN cleansed.zuora.zuora_products_bcv p ON rpc.product_id = p.id
  LEFT JOIN cleansed.salesforce.salesforce_zuora_customer_account_c_bcv z
    ON TRY_CAST(a.zendesk_account_id_c AS INT) = TRY_CAST(z.zendesk_account_id_c AS INT)
  WHERE a.name NOT LIKE '%z4n%'
    AND a.account_type_c = 'Reseller'
  GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12
  ORDER BY s.name DESC
)
SELECT
  r.zuora_account_id,
  r.zuora_account_number,
  r.zuora_account_name,
  r.zendesk_id,
  r.subdomain,
  r.sfdc_id,
  r.account_type,
  a.id AS resellercustomer_account_id,
  a.account_number AS resellercustomer_accountnumber,
  a.name AS resellercustomer_accountname,
  TRY_CAST(a.zendesk_account_id_c AS INT) AS resellercustomer_zendesk_id,
  z.subdomain_c AS resellercustomer_subdomain,
  a.crm_id AS resellercustomer_sfdc_id,
  a.status AS resellercustomer_status,
  a.mrr*12 AS resellercustomer_arr,
  a.currency AS resellercustomer_currency,
  s.id AS resellercustomer_sub_id,
  s.name AS resellercustomer_sub_number,
  s.term_end_date AS resellercustomer_sub_renewal_date,
  s.status AS resellercustomer_sub_status,
  rpc.billing_period AS resellercustomer_billing_period
FROM reseller r
LEFT JOIN cleansed.zuora.zuora_accounts_bcv a ON r.zuora_account_id = a.parent_account_id
LEFT JOIN cleansed.zuora.zuora_subscriptions_bcv s ON a.id = s.account_id
LEFT JOIN cleansed.zuora.zuora_rate_plan_charges_bcv rpc ON s.id = rpc.subscription_id
LEFT JOIN cleansed.salesforce.salesforce_zuora_customer_account_c_bcv z
  ON TRY_CAST(a.zendesk_account_id_c AS INT) = TRY_CAST(z.zendesk_account_id_c AS INT)
WHERE
  s.status = 'Active'
  AND (s.subscription_kind_c = 'Primary'
    OR s.subscription_kind_c IS NULL
    OR s.subscription_kind_c = '')
  AND rpc.effective_start_date <= CURRENT_DATE()
  AND rpc.effective_end_date > CURRENT_DATE()
GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21
ORDER BY r.zuora_account_name ASC, a.name ASC, s.name ASC
`;

  console.log('Running query...');
  const rows = await executeQuery(query);
  console.log(`Fetched ${rows.length} rows from Snowflake`);

  const scored = computePriorityScores(rows);
  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  const snapshotPath = path.join(__dirname, 'data', 'snapshot.json');
  const dir = path.dirname(snapshotPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(snapshotPath, JSON.stringify({
    refreshedAt: new Date().toISOString(),
    count: scored.length,
    data: scored,
  }, null, 2));

  console.log(`Snapshot saved to ${snapshotPath} (${scored.length} records)`);
  console.log('Sales users can now access the dashboard without Snowflake auth.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Refresh failed:', err.message);
  process.exit(1);
});
