import { useState } from 'react';

const formatCurrency = (val, currency) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(val || 0);

const formatDate = (val) => {
  if (!val) return '-';
  return new Date(val).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const priorityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
  unknown: 'bg-gray-100 text-gray-600 border-gray-200',
};

const daysColor = (days) => {
  if (days === null) return 'text-gray-400';
  if (days <= 0) return 'text-red-600 font-bold';
  if (days <= 30) return 'text-red-600 font-semibold';
  if (days <= 60) return 'text-orange-600 font-semibold';
  if (days <= 90) return 'text-yellow-600';
  return 'text-gray-600';
};

const PAGE_SIZE = 25;

const columns = [
  { key: 'priorityScore', label: 'Priority', width: 'w-24' },
  { key: 'ZUORA_ACCOUNT_NAME', label: 'Reseller', width: 'w-44' },
  { key: 'RESELLER_REGION', label: 'Region', width: 'w-28' },
  { key: 'RESELLERCUSTOMER_ACCOUNTNAME', label: 'Customer', width: 'w-44' },
  { key: 'RESELLERCUSTOMER_SUBDOMAIN', label: 'Subdomain', width: 'w-32' },
  { key: 'RESELLERCUSTOMER_ARR', label: 'Local ARR', width: 'w-28' },
  { key: 'arrUsd', label: 'ARR (USD)', width: 'w-28' },
  { key: 'daysUntilRenewal', label: 'Days to Renewal', width: 'w-32' },
  { key: 'RESELLERCUSTOMER_SUB_RENEWAL_DATE', label: 'Renewal Date', width: 'w-32' },
  { key: 'RESELLERCUSTOMER_SUB_NUMBER', label: 'Sub #', width: 'w-32' },
  { key: 'RESELLERCUSTOMER_BILLING_PERIOD', label: 'Billing', width: 'w-24' },
];

export default function RenewalsTable({ data, sortField, sortDir, onSort, totalCount, filteredCount }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const [expandedRow, setExpandedRow] = useState(null);

  function SortIcon({ field }) {
    if (sortField !== field) return <span className="text-gray-300 ml-1">{'\u2195'}</span>;
    return <span className="text-indigo-600 ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table header info */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredCount}</span> of{' '}
          <span className="font-semibold">{totalCount}</span> subscriptions
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${col.width}`}
                >
                  {col.label}
                  <SortIcon field={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageData.map((row, i) => {
              const rowKey = row.RESELLERCUSTOMER_SUB_ID || i;
              const isExpanded = expandedRow === rowKey;

              return (
                <>
                  <tr
                    key={rowKey}
                    onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      row.priorityLevel === 'critical' ? 'bg-red-50/30' : ''
                    }`}
                  >
                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          priorityColors[row.priorityLevel]
                        }`}
                      >
                        {row.priorityScore}
                      </span>
                      <span className="ml-1.5 text-xs text-gray-400 capitalize">{row.priorityLevel}</span>
                    </td>

                    {/* Reseller */}
                    <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[180px]" title={row.ZUORA_ACCOUNT_NAME}>
                      {row.ZUORA_ACCOUNT_NAME}
                    </td>

                    {/* Region */}
                    <td className="px-4 py-3 text-gray-600">
                      {row.RESELLER_REGION || '-'}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3 text-gray-800 truncate max-w-[180px]" title={row.RESELLERCUSTOMER_ACCOUNTNAME}>
                      {row.RESELLERCUSTOMER_ACCOUNTNAME}
                    </td>

                    {/* Subdomain */}
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[140px]">
                      {row.RESELLERCUSTOMER_SUBDOMAIN || '-'}
                    </td>

                    {/* Local ARR */}
                    <td className="px-4 py-3 text-gray-700">
                      <span>{formatCurrency(row.RESELLERCUSTOMER_ARR, row.RESELLERCUSTOMER_CURRENCY)}</span>
                      <span className="ml-1 text-xs text-gray-400">{row.RESELLERCUSTOMER_CURRENCY}</span>
                    </td>

                    {/* ARR (USD) */}
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(row.arrUsd, 'USD')}
                    </td>

                    {/* Days to Renewal */}
                    <td className={`px-4 py-3 ${daysColor(row.daysUntilRenewal)}`}>
                      {row.daysUntilRenewal !== null
                        ? row.daysUntilRenewal <= 0
                          ? `${Math.abs(row.daysUntilRenewal)}d overdue`
                          : `${row.daysUntilRenewal}d`
                        : '-'}
                    </td>

                    {/* Renewal Date */}
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.RESELLERCUSTOMER_SUB_RENEWAL_DATE)}</td>

                    {/* Sub Number */}
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.RESELLERCUSTOMER_SUB_NUMBER}</td>

                    {/* Billing Period */}
                    <td className="px-4 py-3 text-gray-500">{row.RESELLERCUSTOMER_BILLING_PERIOD || '-'}</td>
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <tr key={`${rowKey}-detail`} className="bg-gray-50">
                      <td colSpan={columns.length} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400 text-xs block">SFDC Account</span>
                            {row.RESELLERCUSTOMER_SFDC_ID ? (
                              <a
                                href={`https://zendesk.lightning.force.com/lightning/r/Account/${row.RESELLERCUSTOMER_SFDC_ID}/view#/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-600 hover:text-indigo-800 underline font-mono text-xs"
                              >
                                {row.RESELLERCUSTOMER_SFDC_ID}
                              </a>
                            ) : (
                              <span className="text-gray-700">-</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Account Health Status</span>
                            <span className={`font-semibold ${
                              row['Account Health Status'] === 'Red' || row['Account Health Status'] === 'Churning' ? 'text-red-600' :
                              row['Account Health Status'] === 'Orange' ? 'text-orange-600' :
                              row['Account Health Status'] === 'Yellow' ? 'text-yellow-600' :
                              row['Account Health Status'] === 'Green' ? 'text-green-600' :
                              'text-gray-700'
                            }`}>{row['Account Health Status'] || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Account Health Risk Type</span>
                            <span className="text-gray-700">{row['Account Health Risk Type'] || '-'}</span>
                          </div>
                          {row['Top 3K'] === 'Yes' && (
                            <div>
                              <span className="text-gray-400 text-xs block">Cohort Assignment</span>
                              <span className="text-gray-700">{row['Cohort Assignment'] || '-'}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-400 text-xs block">Zuora Account #</span>
                            <span className="text-gray-700">{row.ZUORA_ACCOUNT_NUMBER}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Customer Account #</span>
                            <span className="text-gray-700">{row.RESELLERCUSTOMER_ACCOUNTNUMBER}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Zendesk ID</span>
                            <span className="text-gray-700">{row.RESELLERCUSTOMER_ZENDESK_ID || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Account Status</span>
                            <span className="text-gray-700">{row.RESELLERCUSTOMER_STATUS}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Sub Status</span>
                            <span className="text-gray-700">{row.RESELLERCUSTOMER_SUB_STATUS}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Urgency Score</span>
                            <span className="text-gray-700">{row.urgencyScore}/100</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Revenue Score</span>
                            <span className="text-gray-700">{row.revenueScore}/100</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Health Score</span>
                            <span className="text-gray-700">{row.healthScore}/100</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  No renewals match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
