import { useState } from 'react';
import { api } from '../lib/api';

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return;
    setErr(''); setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/admin/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data);
    } catch (e: any) {
      setErr(e.response?.data?.error?.message || 'Import failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Census Data (Admin)</h1>
        <p className="text-cm-muted">Upload a CSV to bulk-import indicator values. Existing values for the same (geography, indicator, year, gender, age_group) are updated.</p>
      </div>

      <div className="card p-5 space-y-4">
        <div className="text-sm text-white/70">
          Expected columns: <code className="text-cm-yellow">geography_code, indicator_code, year, value, gender, age_group, source</code>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-cm-green file:text-white hover:file:bg-cm-green-dark"
        />
        {err && <div className="text-cm-red text-sm">{err}</div>}
        <button onClick={upload} disabled={!file || loading} className="btn-primary">
          {loading ? 'Importing…' : 'Import CSV'}
        </button>
      </div>

      {result && (
        <div className="card p-5">
          <div className="text-cm-green font-semibold mb-2">✓ Import complete</div>
          <pre className="bg-cm-ink p-3 rounded text-xs"><code>{JSON.stringify(result, null, 2)}</code></pre>
        </div>
      )}
    </div>
  );
}
