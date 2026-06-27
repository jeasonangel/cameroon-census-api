import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setSession } from '../lib/api';

const TYPES = [
  { v: 'PUBLIC', l: 'Free — 50 requests/mo' },
  { v: 'JOURNALIST', l: 'Journalist — 200 req/mo' },
  { v: 'RESEARCHER', l: 'Researcher — 200 req/mo' },
  { v: 'NGO_PROJECT_MANAGER', l: 'NGO Project Manager — 500 req/mo' },
  { v: 'NGO_DATA_ANALYST', l: 'NGO Data Analyst — 1,000 req/mo' },
  { v: 'NGO_DEVELOPER', l: 'NGO Developer — 2,000 req/mo' },
];

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', organization: '', user_type: 'PUBLIC' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setSession(data.data.token, data.data.user);
      nav('/dashboard');
    } catch (e: any) {
      setErr(e.response?.data?.error?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <div className="card p-8">
        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-cm-muted text-sm mb-6">
          Free tier starts with 50 requests/month. After signing up, click <b>Create API Key</b> to generate one.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Full name</label>
            <input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Password (min 8)</label>
            <input className="input" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div><label className="label">Organization (optional)</label>
            <input className="input" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
          <div><label className="label">Account type</label>
            <select className="input" value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value })}>
              {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>
          {err && <div className="text-cm-red text-sm">{err}</div>}
          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-sm text-cm-muted">
          Already have an account? <Link to="/login" className="text-cm-yellow">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
