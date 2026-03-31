export default function Filters({ filters, onChange, regions }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search reseller, customer, or subdomain..."
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Region filter */}
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Region</label>
          <select
            value={filters.region}
            onChange={(e) => update('region', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => update('priority', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Timeframe filter */}
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Renewal Window</label>
          <select
            value={filters.timeframe}
            onChange={(e) => update('timeframe', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Time</option>
            <option value="30">Next 30 Days</option>
            <option value="60">Next 60 Days</option>
            <option value="90">Next 90 Days</option>
            <option value="180">Next 6 Months</option>
            <option value="365">Next 12 Months</option>
          </select>
        </div>

        {/* Renewal date range */}
        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Renewal From</label>
          <input
            type="date"
            value={filters.renewalFrom || ''}
            onChange={(e) => update('renewalFrom', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Renewal To</label>
          <input
            type="date"
            value={filters.renewalTo || ''}
            onChange={(e) => update('renewalTo', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Top 3K toggle */}
        <div className="pt-4 flex items-center gap-2">
          <button
            onClick={() => update('top3kOnly', !filters.top3kOnly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              filters.top3kOnly ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                filters.top3kOnly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600 whitespace-nowrap">Top 3K Only</span>
        </div>

        {/* Exclude AWS MP toggle */}
        <div className="pt-4 flex items-center gap-2">
          <button
            onClick={() => update('excludeAwsMp', !filters.excludeAwsMp)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              filters.excludeAwsMp ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                filters.excludeAwsMp ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600 whitespace-nowrap">Exclude AWS</span>
        </div>

        {/* Reset */}
        <div className="pt-4">
          <button
            onClick={() => onChange({ search: '', priority: 'all', timeframe: 'all', region: 'all', excludeAwsMp: false, top3kOnly: false, renewalFrom: '', renewalTo: '' })}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
