import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Search, Download, RefreshCw, AlertCircle, Filter } from 'lucide-react';

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [logType, setLogType] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 Fetching logs...');
      const response = await api.get('/admin/logs');
      
      console.log('📥 Full response:', response);
      console.log('📥 Response data:', response.data);
      
      let logsData = [];
      
      // ✅ Check different possible response structures
      if (response.data && typeof response.data === 'object') {
        if (response.data.data?.usage && Array.isArray(response.data.data.usage)) {
          logsData = response.data.data.usage;
        } else if (Array.isArray(response.data.data)) {
          logsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          logsData = response.data;
        } else {
          // Try to extract any array from the response
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              logsData = response.data[key];
              break;
            }
          }
        }
      }
      
      console.log('✅ Logs extracted:', logsData.length);
      setLogs(logsData);
      
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.error?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchFilter = 
      (l.email || l.user_email || '').toLowerCase().includes(filter.toLowerCase()) ||
      (l.action || l.method || '').toLowerCase().includes(filter.toLowerCase()) ||
      (l.endpoint || '').toLowerCase().includes(filter.toLowerCase());
    
    if (logType === 'all') return matchFilter;
    if (logType === 'errors') return matchFilter && l.status_code >= 400;
    if (logType === 'success') return matchFilter && l.status_code < 400 && l.status_code >= 200;
    return matchFilter;
  });

  console.log('🔑 Rendering logs:', logs.length, 'filtered:', filteredLogs.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cm-green mx-auto"></div>
          <p className="mt-4 text-cm-muted">Loading logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-cm-red opacity-50" />
        <div className="text-cm-red text-lg mb-2">⚠️ Error</div>
        <p className="text-cm-muted">{error}</p>
        <button onClick={fetchLogs} className="btn-primary mt-4">
          <RefreshCw className="w-4 h-4 inline mr-2" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Logs</h1>
        <p className="text-cm-muted">Monitor all system activity and API requests</p>
        <p className="text-xs text-cm-muted mt-1">Total logs: {logs.length}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cm-muted" />
          <input
            type="text"
            placeholder="Filter logs by user, action, or endpoint..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <select
          value={logType}
          onChange={(e) => setLogType(e.target.value)}
          className="input w-40"
        >
          <option value="all">All Logs</option>
          <option value="success">Success (2xx)</option>
          <option value="errors">Errors (4xx, 5xx)</option>
        </select>
        <button onClick={fetchLogs} className="btn-ghost" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="card overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 mx-auto mb-3 text-cm-muted opacity-30" />
            <p className="text-cm-muted">No logs found matching your filters</p>
            {logs.length > 0 && <p className="text-xs text-cm-muted mt-1">Showing 0 of {logs.length} total logs</p>}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-cm-ink sticky top-0">
                <tr>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Timestamp</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">User</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Action</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Endpoint</th>
                  <th className="text-center p-3 text-cm-muted text-xs uppercase">Status</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="border-t border-cm-line hover:bg-cm-ink/30 transition-colors">
                    <td className="p-3 text-cm-muted text-xs">
                      {l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="p-3 text-cm-muted">
                      {l.email || l.user_email || 'system'}
                    </td>
                    <td className="p-3 text-white">
                      {l.action || l.method || '—'}
                    </td>
                    <td className="p-3 text-cm-muted text-xs">
                      {l.endpoint || '—'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        l.status_code && l.status_code < 400 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {l.status_code || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-cm-muted text-xs">
                      {l.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}