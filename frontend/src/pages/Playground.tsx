import { useEffect, useState } from 'react';
import api, { API_BASE, getUser } from '../lib/api';

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

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const response = await api.get('/auth/keys');
        const data = response.data;
        if (data.data && Array.isArray(data.data)) {
          setKeys(data.data.filter((k: any) => k.is_active));
        }
      } catch (error) {
        console.error('Failed to fetch keys:', error);
        try {
          const response = await api.get('/api-keys');
          const data = response.data;
          if (data.data && Array.isArray(data.data)) {
            setKeys(data.data.filter((k: any) => k.is_active));
          }
        } catch (e) {
          console.error('Alternative endpoint also failed:', e);
        }
      }
    };
    fetchKeys();
  }, []);

  async function run() {
    if (!apiKey) {
      setResponse('⚠️ Please paste your API key first');
      setStatus(400);
      return;
    }

    setLoading(true);
    setResponse('');
    setStatus(null);

    try {
      const url = `${API_BASE}${endpoint}`;
      console.log('🚀 Fetching:', url);
      
      const r = await fetch(url, {
        headers: { 
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });
      
      setStatus(r.status);
      
      const text = await r.text();
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }
    } catch (e: any) {
      console.error('❌ Fetch error:', e);
      setResponse(`Error: ${e.message || 'Network error'}`);
      setStatus(500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">API Playground</h1>
        <p className="text-cm-muted">Test endpoints live using one of your API keys.</p>
        <p className="text-xs text-cm-muted mt-1">
          API Base URL: <span className="font-mono text-cm-green">{API_BASE}</span>
        </p>
      </div>

      {keys.length === 0 && (
        <div className="card p-5 border-cm-yellow bg-yellow-500/10">
          <div className="text-cm-yellow font-semibold">No active API key</div>
          <p className="text-sm text-white/70 mt-1">
            Head to <b>API Keys</b> and click "Create API Key" first, then paste it below.
          </p>
        </div>
      )}

      <div className="card p-5 space-y-4 bg-cm-panel rounded-lg border border-cm-line">
        <div>
          <label className="label block text-sm font-medium mb-1">API key (paste the full key shown when you created it)</label>
          <input 
            className="input font-mono w-full px-3 py-2 bg-cm-ink border border-cm-line rounded focus:outline-none focus:border-cm-green" 
            placeholder="ck_live_..." 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
          />
        </div>
        
        <div>
          <label className="label block text-sm font-medium mb-1">Endpoint</label>
          <input 
            className="input font-mono w-full px-3 py-2 bg-cm-ink border border-cm-line rounded focus:outline-none focus:border-cm-green" 
            value={endpoint} 
            onChange={(e) => setEndpoint(e.target.value)} 
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {PRESETS.map((p) => (
              <button 
                key={p} 
                onClick={() => setEndpoint(p)} 
                className="text-xs px-2 py-1 rounded border border-cm-line hover:bg-cm-panel"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        
        <button 
          onClick={run} 
          disabled={!apiKey || loading} 
          className="btn-primary w-full bg-cm-green text-white py-2 rounded hover:bg-cm-green/80 disabled:opacity-50"
        >
          {loading ? '⏳ Running…' : `🚀 GET ${endpoint}`}
        </button>
      </div>

      {response && (
        <div className="card p-5 bg-cm-panel rounded-lg border border-cm-line">
          <div className="flex justify-between text-xs text-cm-muted mb-2">
            <span>Response</span>
            <span className={status && status < 300 ? 'text-cm-green' : 'text-cm-red'}>
              HTTP {status}
            </span>
          </div>
          <pre className="bg-cm-ink p-3 rounded text-xs overflow-auto max-h-96">
            <code>{response}</code>
          </pre>
        </div>
      )}
    </div>
  );
}