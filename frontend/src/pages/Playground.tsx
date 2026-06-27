import { useEffect, useState } from 'react';
import { api, API_BASE } from '../lib/api';

const PRESETS = [
  '/geography/regions',
  '/indicators',
  '/data?indicator=POP_TOT',
  '/data?indicator=LIT_RATE',
  '/geography/search?q=cent',
];

export default function Playground() {
  const [keys, setKeys] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState(PRESETS[0]);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/auth/keys').then((r) => setKeys(r.data.data.filter((k: any) => k.is_active))); }, []);

  async function run() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'X-API-Key': apiKey },
      });
      setStatus(r.status);
      const j = await r.json();
      setResponse(JSON.stringify(j, null, 2));
    } catch (e: any) {
      setResponse(String(e));
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">API Playground</h1>
        <p className="text-cm-muted">Test endpoints live using one of your API keys.</p>
      </div>

      {keys.length === 0 && (
        <div className="card p-5 border-cm-yellow">
          <div className="text-cm-yellow font-semibold">No active API key</div>
          <p className="text-sm text-white/70 mt-1">Head to <b>API Keys</b> and click "Create API Key" first, then paste it below.</p>
        </div>
      )}

      <div className="card p-5 space-y-4">
        <div>
          <label className="label">API key (paste the full key shown when you created it)</label>
          <input className="input font-mono" placeholder="ck_live_..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </div>
        <div>
          <label className="label">Endpoint</label>
          <input className="input font-mono" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
          <div className="flex flex-wrap gap-2 mt-2">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setEndpoint(p)} className="text-xs px-2 py-1 rounded border border-cm-line hover:bg-cm-panel">
                {p}
              </button>
            ))}
          </div>
        </div>
        <button onClick={run} disabled={!apiKey || loading} className="btn-primary">
          {loading ? 'Running…' : `GET ${endpoint}`}
        </button>
      </div>

      {response && (
        <div className="card p-5">
          <div className="flex justify-between text-xs text-cm-muted mb-2">
            <span>Response</span>
            <span className={status && status < 300 ? 'text-cm-green' : 'text-cm-red'}>HTTP {status}</span>
          </div>
          <pre className="bg-cm-ink p-3 rounded text-xs overflow-auto max-h-96"><code>{response}</code></pre>
        </div>
      )}
    </div>
  );
}
