const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

const regionColors = [
  'bg-indigo-50 border-indigo-200 text-indigo-700',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
  'bg-violet-50 border-violet-200 text-violet-700',
  'bg-cyan-50 border-cyan-200 text-cyan-700',
  'bg-rose-50 border-rose-200 text-rose-700',
  'bg-amber-50 border-amber-200 text-amber-700',
  'bg-teal-50 border-teal-200 text-teal-700',
  'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700',
];

export default function SummaryCards({ summary, regionStats, activeRegion, onRegionClick, awsStats, onAwsClick, isAwsActive, filteredByPriority, filteredTopResellers, activeTimeframe, onTimeframeClick, activePriority, onPriorityClick, activeReseller, onResellerClick }) {
  if (!summary) return null;

  const cards = [
    {
      label: 'Overdue Renewals',
      value: summary.overdue.count,
      sub: formatCurrency(summary.overdue.arrUsd) + ' USD ARR',
      color: 'bg-red-50 border-red-200 text-red-700',
      timeframe: '0',
    },
    {
      label: 'Next 30 Days',
      value: summary.next30.count,
      sub: formatCurrency(summary.next30.arrUsd) + ' USD ARR',
      color: 'bg-orange-50 border-orange-200 text-orange-700',
      timeframe: '30',
    },
    {
      label: 'Next 60 Days',
      value: summary.next60.count,
      sub: formatCurrency(summary.next60.arrUsd) + ' USD ARR',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      timeframe: '60',
    },
    {
      label: 'Next 90 Days',
      value: summary.next90.count,
      sub: formatCurrency(summary.next90.arrUsd) + ' USD ARR',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      timeframe: '90',
    },
    {
      label: 'Total Active Subs',
      value: summary.totalAccounts,
      sub: formatCurrency(summary.totalArrUsd) + ' total USD ARR',
      color: 'bg-gray-50 border-gray-200 text-gray-700',
      timeframe: 'all',
    },
  ];

  const bp = filteredByPriority || summary.byPriority;
  const priorityBadges = [
    { level: 'critical', count: bp.critical, color: 'bg-red-100 text-red-800' },
    { level: 'high', count: bp.high, color: 'bg-orange-100 text-orange-800' },
    { level: 'medium', count: bp.medium, color: 'bg-yellow-100 text-yellow-800' },
    { level: 'low', count: bp.low, color: 'bg-green-100 text-green-800' },
  ];

  const topResellers = filteredTopResellers || summary.topResellers || [];

  return (
    <div className="space-y-4">
      {/* Regional summary */}
      {regionStats && regionStats.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">By Region (click to filter)</h3>
          <div className="flex flex-wrap gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {regionStats.map((r, i) => {
              const isActive = activeRegion === r.name;
              return (
                <div
                  key={r.name}
                  onClick={() => onRegionClick(r.name)}
                  className={`rounded-lg border p-3 cursor-pointer transition-all ${
                    isActive
                      ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50'
                      : regionColors[i % regionColors.length]
                  } hover:shadow-md`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{r.name}</p>
                  <p className="text-xl font-bold mt-0.5">{r.count} <span className="text-sm font-normal opacity-75">({r.uniqueCustomers})</span></p>
                  <p className="text-xs opacity-75 mt-0.5">{formatCurrency(r.arrUsd)} ARR</p>
                  {r.critical > 0 && (
                    <p className="text-xs text-red-600 font-semibold mt-0.5">{r.critical} critical</p>
                  )}
                </div>
              );
            })}
            {/* AWS tile */}
            {awsStats && (
              <div
                onClick={onAwsClick}
                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                  isAwsActive
                    ? 'ring-2 ring-orange-500 border-orange-400 bg-orange-50'
                    : 'bg-orange-50 border-orange-200 text-orange-700'
                } hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-75">AWS</p>
                  {isAwsActive && <p className="text-xs font-semibold text-orange-600">FILTERED</p>}
                </div>
                <p className="text-xl font-bold mt-0.5">{awsStats.count} <span className="text-sm font-normal opacity-75">({awsStats.uniqueCustomers})</span></p>
                <p className="text-xs opacity-75 mt-0.5">{formatCurrency(awsStats.arrUsd)} ARR</p>
                {awsStats.critical > 0 && (
                  <p className="text-xs text-red-600 font-semibold mt-0.5">{awsStats.critical} critical</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {cards.map((card) => {
          const isActive = activeTimeframe === card.timeframe;
          return (
            <div
              key={card.label}
              onClick={() => onTimeframeClick(card.timeframe)}
              className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md ${
                isActive
                  ? 'ring-2 ring-indigo-500 border-indigo-400'
                  : ''
              } ${card.color}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{card.label}</p>
              <p className="text-xl font-bold mt-0.5">{card.value}</p>
              <p className="text-xs opacity-75 mt-0.5">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Priority breakdown */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-500 cursor-help" title="Priority is scored by combining renewal urgency (40%), ARR value in USD (30%), and Account Health Status (30%). Churning/Red accounts score highest on health. Critical: score 80+, High: 60-79, Medium: 40-59, Low: below 40.">Priority breakdown <span className="text-gray-400">&#9432;</span> :</span>
        {priorityBadges.map((b) => {
          const isActive = activePriority === b.level;
          return (
            <span
              key={b.level}
              onClick={() => onPriorityClick(b.level)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all hover:shadow-md ${b.color} ${
                isActive ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              {b.level.charAt(0).toUpperCase() + b.level.slice(1)}: {b.count}
            </span>
          );
        })}
      </div>

      {/* Top resellers */}
      {topResellers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Resellers by ARR</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topResellers.slice(0, 5).map((r) => {
              const isActive = activeReseller === r.name;
              return (
                <div
                  key={r.name}
                  onClick={() => onResellerClick(r.name)}
                  className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-all hover:shadow-md ${
                    isActive
                      ? 'ring-2 ring-indigo-500 bg-indigo-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-800 truncate mr-2">{r.name}</span>
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {formatCurrency(r.arrUsd)} ({r.count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
