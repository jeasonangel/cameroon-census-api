import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getUser } from '../lib/api';
import { Key, Database, TrendingUp, ArrowRight, Zap, Shield } from 'lucide-react';

export default function Dashboard() {
  const user = getUser()!;
  const isAdmin = user.user_type === 'ADMIN';
  const navigate = useNavigate();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If admin, redirect to admin dashboard
    if (isAdmin) {
      navigate('/admin/dashboard');
      return;
    }

    // Only fetch usage for non-admin users
    const fetchUsage = async () => {
      try {
        const response = await api.get('/auth/usage');
        setUsage(response.data.data);
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchUsage();
  }, [isAdmin, navigate]);

  // If admin, show redirect message
  if (isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cm-green mx-auto"></div>
          <p className="mt-4 text-cm-muted">Redirecting to Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const pct = usage ? Math.min(100, (usage.account.requests_used / Math.max(1, usage.account.monthly_limit)) * 100) : 0;
  const remaining = usage ? Math.max(0, usage.account.monthly_limit - usage.account.requests_used) : 0;
  const totalRequests = usage?.account.requests_used || 0;
  const limit = usage?.account.monthly_limit || 0;

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, <span className="text-cm-green">{user.full_name || user.email.split('@')[0]}</span>
        </h1>
        <p className="text-cm-muted mt-1">
          Monitor your API usage and manage access keys.
        </p>
      </div>

      {/* Main Card - Quota Display */}
      <div className="card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#1d2a25"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#007a5e"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{pct.toFixed(0)}%</span>
                <span className="text-xs text-cm-muted">used</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-cm-muted uppercase tracking-wider mb-1">Monthly Quota</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{remaining.toLocaleString()}</span>
                <span className="text-cm-muted text-sm">requests remaining</span>
              </div>
              <div className="text-sm text-cm-muted mt-1">
                <span className="text-cm-yellow">{totalRequests.toLocaleString()}</span>
                <span className="text-cm-muted"> / {limit.toLocaleString()}</span>
                <span className="text-cm-muted ml-2">this month</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/keys" className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5">
              <Key className="w-4 h-4" />
              Manage API keys
            </Link>
            <Link to="/playground" className="btn-ghost flex items-center justify-center gap-2 px-6 py-2.5">
              Try the API
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/upgrade" className="btn-secondary flex items-center justify-center gap-2 px-6 py-2.5">
              Upgrade plan
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 hover:border-cm-green/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-xs text-cm-muted uppercase tracking-wider">Total Requests</div>
              <div className="text-xl font-bold text-white">{totalRequests.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:border-cm-green/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Database className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xs text-cm-muted uppercase tracking-wider">Monthly Limit</div>
              <div className="text-xl font-bold text-white">{limit.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:border-cm-green/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-xs text-cm-muted uppercase tracking-wider">Available</div>
              <div className="text-xl font-bold text-white">{remaining.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:border-cm-green/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-xs text-cm-muted uppercase tracking-wider">Status</div>
              <div className="text-xl font-bold text-white">
                <span className={`${remaining > 0 ? 'text-emerald-500' : 'text-cm-red'}`}>
                  {remaining > 0 ? 'Active' : 'Exceeded'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/keys" className="text-cm-muted hover:text-cm-green transition-colors">
          Manage API Keys
        </Link>
        <span className="text-cm-line">|</span>
        <Link to="/playground" className="text-cm-muted hover:text-cm-green transition-colors">
          API Playground
        </Link>
        <span className="text-cm-line">|</span>
        <Link to="/docs" className="text-cm-muted hover:text-cm-green transition-colors">
          Documentation
        </Link>
        <span className="text-cm-line">|</span>
        <Link to="/explorer" className="text-cm-muted hover:text-cm-green transition-colors">
          Data Explorer
        </Link>
      </div>
    </div>
  );
}