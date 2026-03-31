import { useState, useMemo } from 'react';
import SummaryCards from './SummaryCards';
import Filters from './Filters';
import RenewalsTable from './RenewalsTable';

export default function Dashboard({ renewals, summary }) {
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    timeframe: 'all',
    region: 'all',
    excludeAwsMp: false,
    top3kOnly: false,
  });
  const [sortField, setSortField] = useState('priorityScore');
  const [sortDir, setSortDir] = useState('desc');

  // Extract unique regions for the filter dropdown
  const regions = useMemo(() => {
    const set = new Set();
    renewals.forEach((r) => {
      if (r.RESELLER_REGION) set.add(r.RESELLER_REGION);
    });
    return [...set].sort();
  }, [renewals]);

  const [awsOnly, setAwsOnly] = useState(false);
  const [resellerFilter, setResellerFilter] = useState(null);

  // Apply all filters except region — used to compute region tile stats
  function applyBaseFilters(r) {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchesReseller = r.ZUORA_ACCOUNT_NAME?.toLowerCase().includes(q);
      const matchesCustomer = r.RESELLERCUSTOMER_ACCOUNTNAME?.toLowerCase().includes(q);
      const matchesSubdomain = r.RESELLERCUSTOMER_SUBDOMAIN?.toLowerCase().includes(q);
      if (!matchesReseller && !matchesCustomer && !matchesSubdomain) return false;
    }
    if (filters.excludeAwsMp && r.ZUORA_ACCOUNT_NAME?.toUpperCase().includes('AWS')) return false;
    if (awsOnly && !r.ZUORA_ACCOUNT_NAME?.toUpperCase().includes('AWS')) return false;
    if (filters.top3kOnly && r['Top 3K'] !== 'Yes') return false;
    if (filters.priority !== 'all' && r.priorityLevel !== filters.priority) return false;
    if (filters.timeframe === '0') {
      if (r.daysUntilRenewal === null || r.daysUntilRenewal > 0) return false;
    } else if (filters.timeframe !== 'all') {
      const days = parseInt(filters.timeframe, 10);
      if (r.daysUntilRenewal === null || r.daysUntilRenewal > days) return false;
    }
    return true;
  }

  const baseFiltered = renewals.filter(applyBaseFilters);

  // Region stats from base-filtered data (all filters except region)
  const regionStats = useMemo(() => {
    const map = {};
    baseFiltered.forEach((r) => {
      const region = r.RESELLER_REGION || 'Unknown';
      if (!map[region]) map[region] = { name: region, count: 0, arrUsd: 0, critical: 0, customers: new Set() };
      map[region].count += 1;
      map[region].arrUsd += r.arrUsd || 0;
      if (r.priorityLevel === 'critical') map[region].critical += 1;
      if (r.RESELLERCUSTOMER_SFDC_ID) map[region].customers.add(r.RESELLERCUSTOMER_SFDC_ID);
    });
    return Object.values(map)
      .map((r) => ({ ...r, uniqueCustomers: r.customers.size }))
      .sort((a, b) => b.arrUsd - a.arrUsd);
  }, [baseFiltered]);

  // AWS stats from base-filtered data
  const awsStats = useMemo(() => {
    const stats = { count: 0, arrUsd: 0, critical: 0, customers: new Set() };
    baseFiltered.forEach((r) => {
      if (r.ZUORA_ACCOUNT_NAME?.toUpperCase().includes('AWS')) {
        stats.count += 1;
        stats.arrUsd += r.arrUsd || 0;
        if (r.priorityLevel === 'critical') stats.critical += 1;
        if (r.RESELLERCUSTOMER_SFDC_ID) stats.customers.add(r.RESELLERCUSTOMER_SFDC_ID);
      }
    });
    return stats.count > 0 ? { ...stats, uniqueCustomers: stats.customers.size } : null;
  }, [baseFiltered]);

  // Full filter including region and reseller
  const filtered = baseFiltered.filter((r) => {
    if (filters.region !== 'all' && r.RESELLER_REGION !== filters.region) return false;
    if (resellerFilter && r.ZUORA_ACCOUNT_NAME !== resellerFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') aVal = aVal?.toLowerCase() || '';
    if (typeof bVal === 'string') bVal = bVal?.toLowerCase() || '';

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'priorityScore' || field === 'RESELLERCUSTOMER_ARR' || field === 'arrUsd' ? 'desc' : 'asc');
    }
  }

  // Compute timeframe summary from filtered data
  const filteredSummary = useMemo(() => {
    const overdue = filtered.filter((r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= 0);
    const next30 = filtered.filter((r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= 30);
    const next60 = filtered.filter((r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= 60);
    const next90 = filtered.filter((r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= 90);
    const totalAccounts = filtered.length;
    const totalArrUsd = filtered.reduce((sum, r) => sum + (r.arrUsd || 0), 0);
    return {
      overdue: { count: overdue.length, arrUsd: overdue.reduce((s, r) => s + (r.arrUsd || 0), 0) },
      next30: { count: next30.length, arrUsd: next30.reduce((s, r) => s + (r.arrUsd || 0), 0) },
      next60: { count: next60.length, arrUsd: next60.reduce((s, r) => s + (r.arrUsd || 0), 0) },
      next90: { count: next90.length, arrUsd: next90.reduce((s, r) => s + (r.arrUsd || 0), 0) },
      totalAccounts,
      totalArrUsd,
    };
  }, [filtered]);

  // Compute priority breakdown and top resellers from filtered data
  const filteredByPriority = useMemo(() => ({
    critical: filtered.filter((r) => r.priorityLevel === 'critical').length,
    high: filtered.filter((r) => r.priorityLevel === 'high').length,
    medium: filtered.filter((r) => r.priorityLevel === 'medium').length,
    low: filtered.filter((r) => r.priorityLevel === 'low').length,
  }), [filtered]);

  const filteredTopResellers = useMemo(() => {
    const next90 = filtered.filter((r) => r.daysUntilRenewal !== null && r.daysUntilRenewal <= 90);
    const map = {};
    next90.forEach((r) => {
      const name = r.ZUORA_ACCOUNT_NAME || 'Unknown';
      if (!map[name]) map[name] = { name, arrUsd: 0, count: 0 };
      map[name].arrUsd += r.arrUsd || 0;
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => b.arrUsd - a.arrUsd).slice(0, 10);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <SummaryCards
        summary={filteredSummary}
        regionStats={regionStats}
        activeRegion={filters.region}
        onRegionClick={(region) =>
          setFilters((f) => ({ ...f, region: f.region === region ? 'all' : region }))
        }
        awsStats={awsStats}
        isAwsActive={awsOnly}
        onAwsClick={() => setAwsOnly((v) => !v)}
        filteredByPriority={filteredByPriority}
        filteredTopResellers={filteredTopResellers}
        activeTimeframe={filters.timeframe}
        onTimeframeClick={(tf) =>
          setFilters((f) => ({ ...f, timeframe: f.timeframe === tf ? 'all' : tf }))
        }
        activePriority={filters.priority}
        onPriorityClick={(level) =>
          setFilters((f) => ({ ...f, priority: f.priority === level ? 'all' : level }))
        }
        activeReseller={resellerFilter}
        onResellerClick={(name) =>
          setResellerFilter((v) => (v === name ? null : name))
        }
      />
      <Filters filters={filters} onChange={setFilters} regions={regions} />
      <RenewalsTable
        data={sorted}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        totalCount={renewals.length}
        filteredCount={filtered.length}
      />
    </div>
  );
}
