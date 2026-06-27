import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUser } from '../lib/api';
import {
  Users, Key, Database, TrendingUp, Shield, Activity,
  BarChart3, FileSpreadsheet, Settings, UserPlus,
  ArrowRight, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const user = getUser()!;
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/stats').then((r) => setStats(r.data.data)).catch(() => {}),
      api.get('/admin/users?limit=5').then((r) => setRecentUsers(r.data.data || [])).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cm-green mx-auto"></div>
          <p className="mt-4 text-cm-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats?.users || 0, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Key, label: 'Active API Keys', value: stats?.active_keys || 0, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: TrendingUp, label: 'Requests (30d)', value: stats?.requests_30d || 0, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Database, label: 'Geographies', value: stats?.geographies || 0, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const quickActions = [
    { icon: Users, label: 'Manage Users', path: '/admin/users', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Key, label: 'API Keys', path: '/admin/api-keys', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: FileSpreadsheet, label: 'Import Data', path: '/admin/import', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: Settings, label: 'Settings', path: '/admin/settings', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            👋 Welcome back, <span className="text-cm-green">System Administrator</span>
          </h1>
          <p className="text-cm-muted mt-1">
            System overview and management dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <span className="px-3 py-1 bg-cm-ink rounded-full text-xs text-cm-muted border border-cm-line">
            ADMIN
          </span>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs border border-emerald-500/20">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
            System Online
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5 hover:border-cm-green/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xs text-cm-muted uppercase tracking-wider">{stat.label}</div>
                <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="card p-5 hover:border-cm-green/30 transition-all hover:scale-[1.02] group"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`p-3 rounded-xl ${action.bg}`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <span className="text-sm font-medium text-white group-hover:text-cm-green transition-colors">
                {action.label}
              </span>
              <span className="text-xs text-cm-muted">Click to manage →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Users */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cm-green" />
              Recent Users
            </h3>
            <p className="text-sm text-cm-muted">Latest registered users and their activity</p>
          </div>
          <Link to="/admin/users" className="text-sm text-cm-green hover:text-emerald-400 flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cm-ink">
                <tr>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">User</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Email</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Type</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Keys</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Status</th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-t border-cm-line hover:bg-cm-ink/30 transition-colors">
                    <td className="p-3 font-medium text-white">{u.full_name || '—'}</td>
                    <td className="p-3 text-cm-muted">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-cm-ink rounded text-xs text-cm-muted">
                        {u.user_type?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-center">{u.api_keys_count || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link to={`/admin/users/${u.id}`} className="text-cm-muted hover:text-cm-green transition-colors">
                        <Shield className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-cm-muted">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No users registered yet</p>
          </div>
        )}
      </div>

      {/* System Status & Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cm-green" />
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded-lg bg-cm-ink/50">
              <span className="text-cm-muted">API Status</span>
              <span className="text-emerald-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Operational
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-cm-ink/50">
              <span className="text-cm-muted">Database</span>
              <span className="text-emerald-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full"></span>
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-cm-ink/50">
              <span className="text-cm-muted">Cache (Redis)</span>
              <span className="text-emerald-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full"></span>
                Online
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-cm-ink/50">
              <span className="text-cm-muted">Last Backup</span>
              <span className="text-cm-muted">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cm-yellow" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link to="/admin/import" className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
              <span className="text-emerald-400 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Import New Data
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
            <Link to="/admin/users" className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <span className="text-blue-400 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add New User
              </span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </Link>
            <Link to="/admin/api-keys" className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <span className="text-purple-400 flex items-center gap-2">
                <Key className="w-4 h-4" />
                View All API Keys
              </span>
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}