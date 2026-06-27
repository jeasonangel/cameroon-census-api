import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Key {
  id: number; name: string; key_prefix: string; is_active: boolean;
  created_at: string; last_used: string | null;
}

export default function Keys() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [err, setErr] = useState('');

  async function load() {
    const { data } = await api.get('/auth/keys');
    setKeys(data.data);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setCreating(true);
    try {
      const { data } = await api.post('/auth/keys', { name });
      setNewKey(data.data.api_key);
      setName(''); setShowForm(false);
      load();
    } catch (e: any) {
      setErr(e.response?.data?.error?.message || 'Failed');
    } finally { setCreating(false); }
  }

  async function revoke(id: number) {
    if (!confirm('Revoke this key? Apps using it will lose access immediately.')) return;
    await api.delete(`/auth/keys/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-cm-muted">Keys are shown <b>once</b> on creation. Store them securely.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setNewKey(null); }} className="btn-primary">
          + Create API Key
        </button>
      </div>

      {newKey && (
        <div className="card border-cm-yellow p-5">
          <div className="text-cm-yellow font-semibold mb-2">Save this key now — it won't be shown again.</div>
          <div className="bg-cm-ink p-3 rounded font-mono text-sm break-all">{newKey}</div>
          <button onClick={() => { navigator.clipboard.writeText(newKey); }} className="btn-yellow mt-3 text-xs">Copy</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={create} className="card p-5 space-y-3">
          <div>
            <label className="label">Key name (e.g. "Production backend")</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {err && <div className="text-cm-red text-sm">{err}</div>}
          <div className="flex gap-2">
            <button disabled={creating} className="btn-primary">{creating ? 'Creating…' : 'Generate Key'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cm-ink text-cm-muted text-xs uppercase">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Prefix</th><th className="text-left p-3">Status</th><th className="text-left p-3">Created</th><th className="text-left p-3">Last used</th><th></th></tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-cm-muted">
                No API keys yet. Click <b>Create API Key</b> to generate your first one.
              </td></tr>
            )}
            {keys.map((k) => (
              <tr key={k.id} className="border-t border-cm-line">
                <td className="p-3 font-medium">{k.name}</td>
                <td className="p-3 font-mono text-xs text-cm-yellow">{k.key_prefix}…</td>
                <td className="p-3">{k.is_active
                  ? <span className="text-cm-green">● Active</span>
                  : <span className="text-cm-muted">● Revoked</span>}</td>
                <td className="p-3 text-cm-muted">{new Date(k.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-cm-muted">{k.last_used ? new Date(k.last_used).toLocaleString() : '—'}</td>
                <td className="p-3 text-right">
                  {k.is_active && <button onClick={() => revoke(k.id)} className="text-cm-red text-xs hover:underline">Revoke</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
