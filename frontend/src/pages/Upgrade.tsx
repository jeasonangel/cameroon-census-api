import { Link } from 'react-router-dom';

export default function Upgrade() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="card p-10 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Upgrade your plan</h1>
          <p className="mt-4 text-white/70 text-lg max-w-3xl">
            Need higher monthly request limits or access for multiple analysts? Choose the plan that matches your organization,
            then request an upgrade from an administrator.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'Journalist / Researcher', limit: '200 req/mo', description: 'For reporting, articles, and academic work.' },
            { name: 'NGO', limit: '500–1,000 req/mo', description: 'For field programs and impact monitoring.' },
            { name: 'NGO Developer', limit: '2,000 req/mo', description: 'For application integrations and dashboards.' },
            { name: 'Enterprise', limit: 'Custom', description: 'For larger analytics teams or partner projects.' },
          ].map((plan) => (
            <div key={plan.name} className="border border-cm-line rounded-xl p-6">
              <div className="text-cm-yellow font-semibold text-sm">{plan.name}</div>
              <div className="text-3xl font-bold mt-3">{plan.limit}</div>
              <p className="mt-4 text-white/70 text-sm">{plan.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-cm-panel border border-cm-line rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">How to upgrade</h2>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>Choose the plan that fits your use case.</li>
            <li>Contact your admin or email <span className="text-cm-yellow">admin@census.cm</span>.</li>
            <li>Provide your account email and the requested plan.</li>
            <li>Once approved, your quota and access level will be updated.</li>
          </ol>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/" className="btn-primary">Upgrade</Link>
        </div>
      </div>
    </div>
  );
}
