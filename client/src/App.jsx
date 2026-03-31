import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [renewals, setRenewals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [snapshotInfo, setSnapshotInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing session on load
  useEffect(() => {
    async function verifyToken() {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (data.valid) {
          setAuthenticated(true);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch {
        // Offline or error — keep token and try
      }
      setCheckingAuth(false);
    }
    verifyToken();
  }, []);

  // Fetch data once authenticated
  useEffect(() => {
    if (!authenticated) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [renewalsRes, summaryRes, snapshotRes] = await Promise.all([
          fetch('/api/renewals'),
          fetch('/api/renewals/summary'),
          fetch('/api/renewals/snapshot-info'),
        ]);

        if (!renewalsRes.ok || !summaryRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const renewalsData = await renewalsRes.json();
        const summaryData = await summaryRes.json();
        const snapshotData = snapshotRes.ok ? await snapshotRes.json() : null;

        setRenewals(renewalsData.data);
        setSummary(summaryData);
        setSnapshotInfo(snapshotData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authenticated]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading renewals data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg">Connection Error</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <p className="text-red-500 text-sm mt-2">
            Check that the server is running and configured correctly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Renewals Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prioritized view of upcoming partner subscription renewals
          </p>
        </div>
        <div className="flex items-center gap-4">
          {snapshotInfo?.refreshedAt && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Data last refreshed</p>
              <p className="text-sm text-gray-600 font-medium">
                {new Date(snapshotInfo.refreshedAt).toLocaleString()}
              </p>
            </div>
          )}
          <button
            onClick={async () => {
              setRefreshing(true);
              try {
                await fetch('/api/renewals/refresh', { method: 'POST' });
                const [renewalsRes, summaryRes, snapshotRes] = await Promise.all([
                  fetch('/api/renewals'),
                  fetch('/api/renewals/summary'),
                  fetch('/api/renewals/snapshot-info'),
                ]);
                const renewalsData = await renewalsRes.json();
                const summaryData = await summaryRes.json();
                const snapshotData = await snapshotRes.json();
                setRenewals(renewalsData.data);
                setSummary(summaryData);
                setSnapshotInfo(snapshotData);
              } catch (err) {
                console.error('Refresh failed:', err);
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              setAuthenticated(false);
            }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="px-6 py-6">
        <Dashboard renewals={renewals} summary={summary} />
      </main>
    </div>
  );
}
