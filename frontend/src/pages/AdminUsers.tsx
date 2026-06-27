import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Search, UserPlus, Trash2, Edit, Key, CheckCircle, XCircle } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        console.log('👥 Users response:', response.data);
        
        // Try different possible response structures
        let usersData = [];
        if (response.data?.data?.users) {
          usersData = response.data.data.users;
        } else if (response.data?.data) {
          usersData = response.data.data;
        } else if (Array.isArray(response.data)) {
          usersData = response.data;
        } else {
          usersData = [];
        }
        
        setUsers(usersData);
      } catch (err: any) {
        console.error('Failed to fetch users:', err);
        setError(err.response?.data?.error?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cm-green mx-auto"></div>
          <p className="mt-4 text-cm-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="text-cm-red text-lg mb-2">⚠️ Error</div>
        <p className="text-cm-muted">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-cm-muted">Manage all registered users and their accounts</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cm-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <div className="text-sm text-cm-muted flex items-center">
          Total: <span className="text-white font-bold ml-1">{users.length}</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 mx-auto mb-3 text-cm-muted opacity-30" />
            <p className="text-cm-muted">No users registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cm-ink">
                <tr>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">User</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Email</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Type</th>
                  <th className="text-center p-3 text-cm-muted text-xs uppercase">Keys</th>
                  <th className="text-center p-3 text-cm-muted text-xs uppercase">Requests</th>
                  <th className="text-center p-3 text-cm-muted text-xs uppercase">Status</th>
                  <th className="text-right p-3 text-cm-muted text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-cm-line hover:bg-cm-ink/30 transition-colors">
                    <td className="p-3 font-medium text-white">{u.full_name || '—'}</td>
                    <td className="p-3 text-cm-muted">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-cm-ink rounded text-xs text-cm-muted">
                        {u.user_type?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-center">{u.api_keys_count || 0}</td>
                    <td className="p-3 text-center">{u.requests_used || 0}</td>
                    <td className="p-3 text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-cm-muted hover:text-cm-green transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-cm-muted hover:text-cm-red transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="text-cm-muted hover:text-cm-yellow transition-colors" title="API Keys">
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
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