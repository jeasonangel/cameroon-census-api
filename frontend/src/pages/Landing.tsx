import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cm-line">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-cm-green blur-3xl" />
          <div className="absolute top-40 right-0 w-96 h-96 rounded-full bg-cm-red blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-cm-yellow blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-cm-line bg-cm-panel mb-6">
            <span className="w-2 h-2 rounded-full bg-cm-green animate-pulse" /> Live v1
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
            Cameroon Census Data,<br />
            <span className="text-cm-yellow">one REST call away.</span>
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl">
            A modern API for NGOs, researchers, and journalists. Regions, departments,
            districts, villages, and indicators — built for integration into your systems.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">Request API Key →</Link>
            <Link to="/register" className="btn-ghost">Upgrade plan</Link>
          </div>
          <div className="mt-12 card p-4 max-w-2xl">
            <div className="text-xs text-cm-muted mb-2">EXAMPLE</div>
            <pre className="text-sm text-cm-yellow overflow-x-auto"><code>{`curl https://your-domain/api/v1/geography/regions \\
  -H "X-API-Key: ck_live_xxxxxxxxxxxxxxxxxx"`}</code></pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6">
        {[
          { c: 'bg-cm-green', t: 'Hierarchical Geography', d: '10 regions → departments → districts → villages with coordinates.' },
          { c: 'bg-cm-red', t: 'Rich Indicators', d: 'Population, literacy, water access, school enrollment, employment.' },
          { c: 'bg-cm-yellow', t: 'CSV Export', d: 'Bulk export filtered data for analysis or import into your tools.' },
        ].map((f) => (
          <div key={f.t} className="card p-6">
            <div className={`w-10 h-10 rounded-md ${f.c} mb-4`} />
            <h3 className="font-bold text-lg mb-1">{f.t}</h3>
            <p className="text-white/60 text-sm">{f.d}</p>
          </div>
        ))}
      </section>

      {/* Plans */}
      <section className="border-y border-cm-line bg-cm-panel/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold mb-2">Plans</h2>
          <p className="text-white/60 mb-10">Start free with 50 requests / month. Upgrade by contacting an admin.</p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { n: 'Free', q: '50', d: 'Default for new accounts. Click "Create API Key" to begin.' },
              { n: 'Journalist / Researcher', q: '200', d: 'For reporting and academic projects.' },
              { n: 'NGO', q: '500–1,000', d: 'For analysts and project managers.' },
              { n: 'NGO Developer', q: '2,000', d: 'For full backend integrations.' },
            ].map((p) => (
              <div key={p.n} className="card p-6">
                <div className="text-cm-yellow text-sm font-semibold">{p.n}</div>
                <div className="text-3xl font-bold mt-2">{p.q}<span className="text-sm text-cm-muted font-normal"> req/mo</span></div>
                <div className="text-white/60 text-sm mt-3">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-cm-muted text-sm flex justify-between">
        <div>© Cameroon Census Data API</div>
        <div className="flex gap-4">
          <Link to="/register">Docs</Link>
          <Link to="/login">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
