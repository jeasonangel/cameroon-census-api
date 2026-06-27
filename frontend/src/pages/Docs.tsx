const ENDPOINTS = [
  // ============================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================
  { m: 'POST', p: '/api/v1/auth/register', d: 'Create account. Returns JWT session token.' },
  { m: 'POST', p: '/api/v1/auth/login', d: 'Sign in. Returns JWT session token.' },
  { m: 'GET',  p: '/api/v1/auth/me', d: 'Current account (requires Bearer token).' },
  { m: 'POST', p: '/api/v1/auth/keys', d: 'Create a new API key. Body: { name }. Returns full key once.' },
  { m: 'GET',  p: '/api/v1/auth/keys', d: 'List your API keys (only prefix shown).' },
  { m: 'DELETE', p: '/api/v1/auth/keys/:id', d: 'Revoke a key.' },
  { m: 'GET',  p: '/api/v1/auth/usage', d: 'Quota + last 30 days of requests.' },

  // ============================================================
  // GEOGRAPHY ENDPOINTS
  // ============================================================
  { m: 'GET',  p: '/api/v1/geography/regions', d: 'List all 10 regions of Cameroon.' },
  { m: 'GET',  p: '/api/v1/geography/regions/:code/departments', d: 'List departments in a region.' },
  { m: 'GET',  p: '/api/v1/geography/departments/:code/districts', d: 'List districts in a department.' },
  { m: 'GET',  p: '/api/v1/geography/districts/:code/villages', d: 'List villages in a district.' },
  { m: 'GET',  p: '/api/v1/geography/search?q=', d: 'Search geographies by name.' },

  // ============================================================
  // DATA ENDPOINTS
  // ============================================================
  { m: 'GET',  p: '/api/v1/indicators', d: 'List all available indicators with their codes.' },
  { m: 'GET',  p: '/api/v1/data?geography=&indicator=&year=', d: 'Get filtered census data for a specific geography and indicator.' },
  { m: 'GET',  p: '/api/v1/export?indicator=&format=csv', d: 'Download census data as CSV.' },

  // ============================================================
  // ANALYTICS ENDPOINTS (NEW)
  // ============================================================
  { m: 'GET',  p: '/api/v1/analytics/regions', d: 'Get ALL regions with ALL key indicators (population, water, literacy, etc.) from pre-computed summary.' },
  { m: 'GET',  p: '/api/v1/analytics/regions/:code', d: 'Get detailed summary for a specific region with all indicators.' },
  { m: 'GET',  p: '/api/v1/analytics/regions/rank/water', d: 'Regions ranked by water access (best to worst).' },
  { m: 'GET',  p: '/api/v1/analytics/departments/rank?region=&indicator=&order=', d: 'Departments ranked by any indicator (water, literacy, school, employment, poverty, income, population).' },
  { m: 'GET',  p: '/api/v1/analytics/compare/regions?code1=&code2=', d: 'Compare two regions across all key indicators.' },
  { m: 'GET',  p: '/api/v1/analytics/best-worst?indicator=&level=', d: 'Find the best and worst geography for any indicator (region or department).' },
];

export default function Docs() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <p className="text-cm-muted">REST · JSON · API-key authenticated</p>
      </div>

      {/* Authentication Section */}
      <section className="card p-6 space-y-3">
        <h2 className="font-bold text-lg">Authentication</h2>
        <p className="text-white/70 text-sm">
          All data endpoints require an API key in the <code className="text-cm-yellow">X-API-Key</code> header. 
          Generate keys in the <b>API Keys</b> page (must be explicitly requested — none are auto-issued).
        </p>
        <pre className="bg-cm-ink p-3 rounded text-xs overflow-x-auto">
          <code>{`curl https://api.example.com/api/v1/geography/regions \\
  -H "X-API-Key: ck_live_xxxxxxxxxxxxxx"`}</code>
        </pre>
        <p className="text-white/70 text-sm">
          Dashboard/admin endpoints use a <code className="text-cm-yellow">Authorization: Bearer &lt;jwt&gt;</code> token from <code>/auth/login</code>.
        </p>
      </section>

      {/* Rate Limits Section */}
      <section className="card p-6 space-y-3">
        <h2 className="font-bold text-lg">Rate Limits</h2>
        <ul className="text-sm text-white/70 space-y-1">
          <li><b className="text-cm-green">Free / Public</b> — 50 requests/month</li>
          <li><b className="text-cm-green">Journalist / Researcher</b> — 200 requests/month</li>
          <li><b className="text-cm-green">NGO Project Manager</b> — 500 requests/month</li>
          <li><b className="text-cm-green">NGO Data Analyst</b> — 1,000 requests/month</li>
          <li><b className="text-cm-green">NGO Developer</b> — 2,000 requests/month</li>
        </ul>
      </section>

      {/* Analytics Quick Guide Section */}
      <section className="card p-6 space-y-3 border-l-4 border-cm-green">
        <h2 className="font-bold text-lg">📊 Analytics Endpoints — Quick Guide</h2>
        <p className="text-white/70 text-sm">
          These endpoints answer real-world questions without complex filtering:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-cm-ink p-3 rounded">
            <b className="text-cm-green">Which region has the best water access?</b>
            <code className="block text-xs text-white/60 mt-1">GET /analytics/best-worst?indicator=water_access&level=region</code>
          </div>
          <div className="bg-cm-ink p-3 rounded">
            <b className="text-cm-green">Which department in West has worst water?</b>
            <code className="block text-xs text-white/60 mt-1">GET /analytics/departments/rank?region=WS&indicator=water_access&order=asc</code>
          </div>
          <div className="bg-cm-ink p-3 rounded">
            <b className="text-cm-green">Compare Centre vs Littoral</b>
            <code className="block text-xs text-white/60 mt-1">GET /analytics/compare/regions?code1=CE&code2=LT</code>
          </div>
          <div className="bg-cm-ink p-3 rounded">
            <b className="text-cm-green">Full profile of West region</b>
            <code className="block text-xs text-white/60 mt-1">GET /analytics/regions/WS</code>
          </div>
        </div>
      </section>

      {/* All Endpoints Section */}
      <section className="card p-6">
        <h2 className="font-bold text-lg mb-4">All Endpoints</h2>
        <div className="space-y-2">
          {ENDPOINTS.map((e, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-cm-line last:border-0">
              <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
                e.m === 'GET' ? 'bg-cm-green' : 
                e.m === 'POST' ? 'bg-cm-yellow text-cm-ink' : 
                'bg-cm-red'
              }`}>{e.m}</span>
              <div>
                <code className="text-sm">{e.p}</code>
                <div className="text-xs text-cm-muted mt-0.5">{e.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Response Format Section */}
      <section className="card p-6 space-y-3">
        <h2 className="font-bold text-lg">Response Format</h2>
        <pre className="bg-cm-ink p-3 rounded text-xs">
          <code>{`{ "data": { ... } }      // success
{ "error": { "code": "...", "message": "..." } }  // failure`}</code>
        </pre>
        <p className="text-white/70 text-sm text-xs">
          Analytics endpoints return pre-computed summaries from materialized views for fast responses.
        </p>
      </section>
    </div>
  );
}