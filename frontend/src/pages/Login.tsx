import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setSession } from '../lib/api';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(data.data.token, data.data.user);
      nav('/dashboard');
    } catch (e: any) {
      setErr(e.response?.data?.error?.message || 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <div className="card p-8">
        <h1 className="text-2xl font-bold mb-1">Sign in</h1>
        <p className="text-cm-muted text-sm mb-6">Access your dashboard, API keys, and usage.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {err && <div className="text-cm-red text-sm">{err}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-sm text-cm-muted">
          No account? <Link to="/register" className="text-cm-yellow">Register here</Link>
        </p>
      </div>
    </div>
  );
}
