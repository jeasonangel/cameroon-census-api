
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Search, Key, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchKeys = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔑 Fetching API keys...');
      const response = await api.get('/admin/api-keys');
      
      console.log('📥 Full response:', response);
      console.log('📥 Response data:', response.data);
      
      let keysData = [];
      
      // ✅ Check different possible response structures
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.data)) {
          keysData = response.data.data;
        } else if (Array.isArray(response.data)) {
          keysData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data.keys)) {
          keysData = response.data.data.keys;
        } else if (response.data.keys && Array.isArray(response.data.keys)) {
          keysData = response.data.keys;
        } else {
          // Try to extract any array from the response
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              keysData = response.data[key];
              break;
            }
          }
        }
      }
      
      console.log('✅ Keys extracted:', keysData.length);
      setKeys(keysData);
      
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.error?.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const filteredKeys = keys.filter(k =>
    k.name?.toLowerCase().includes(search.toLowerCase()) ||
    k.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    k.key_prefix?.toLowerCase().includes(search.toLowerCase())
  );

  console.log('🔑 Rendering with keys:', keys.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cm-green mx-auto"></div>
          <p className="mt-4 text-cm-muted">Loading API keys...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="text-cm-red text-lg mb-2">⚠️ Error</div>
        <p className="text-cm-muted">{error}</p>
        <button onClick={fetchKeys} className="btn-primary mt-4">
          <RefreshCw className="w-4 h-4 inline mr-2" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">API Key Management</h1>
        <p className="text-cm-muted">View and manage all API keys across the system</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cm-muted" />
          <input
            type="text"
            placeholder="Search by key name, owner, or prefix..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <button onClick={fetchKeys} className="btn-ghost" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
        <div className="text-sm text-cm-muted flex items-center">
          Total: <span className="text-white font-bold ml-1">{keys.length}</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        {keys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-12 h-12 mx-auto mb-3 text-cm-muted opacity-30" />
            <p className="text-cm-muted">No API keys found in the system</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cm-ink">
                <tr>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Key Name</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Owner</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Owner Type</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Prefix</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Created</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Last Used</th>
                  <th className="text-center p-3 text-cm-muted text-xs uppercase">Status</th>
                  <th className="text-right p-3 text-cm-muted text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((k) => (
                  <tr key={k.id} className="border-t border-cm-line hover:bg-cm-ink/30 transition-colors">
                    <td className="p-3 font-medium text-white">{k.name || '—'}</td>
                    <td className="p-3 text-cm-muted">{k.user_email || '—'}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-cm-ink rounded text-xs text-cm-muted">
                        {k.user_type?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      <code className="text-xs text-cm-yellow bg-cm-ink px-2 py-1 rounded">
                        {k.key_prefix || '—'}
                      </code>
                    </td>
                    <td className="p-3 text-cm-muted text-xs">
                      {k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-cm-muted text-xs">
                      {k.last_used ? new Date(k.last_used).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-3 text-center">
                      {k.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                          <XCircle className="w-3 h-3" /> Revoked
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        className="text-cm-muted hover:text-cm-red transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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