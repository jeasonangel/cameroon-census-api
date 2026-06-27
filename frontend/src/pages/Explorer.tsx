import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { Download, MapPin, TrendingUp, Users, Database, ChevronDown, ChevronUp } from 'lucide-react';

const COLORS = ['#007a5e', '#ce1126', '#fcd116', '#005a45', '#a00d1f', '#d9b212', '#3fa67a', '#e35d6a', '#ffe066', '#6b8079'];

// Helper to format large numbers
const formatNumber = (num: number) => {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

export default function Explorer() {
  // State
  const [regions, setRegions] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [indicator, setIndicator] = useState('POP_TOT');
  const [year, setYear] = useState(2024);
  const [geographyLevel, setGeographyLevel] = useState('region');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showTable, setShowTable] = useState(false);

  const availableYears = [2024, 2005];

  // Load regions and indicators
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [regionsRes, indicatorsRes] = await Promise.all([
          api.get('/geography/regions'),
          api.get('/indicators'),
        ]);
        setRegions(regionsRes.data.data || []);
        setIndicators(indicatorsRes.data.data || []);
      } catch (e: any) {
        setErr(e.response?.data?.error?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load data when indicator, year, or geography level changes
  useEffect(() => {
    if (!indicator) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/data?indicator=${indicator}&year=${year}`);
        const rawData = response.data.data || [];
        const filtered = rawData.filter((d: any) => d.geography_level === geographyLevel);
        setData(filtered);
      } catch (e: any) {
        console.error('Failed to fetch data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [indicator, year, geographyLevel]);

  // Current indicator details
  const currentIndicator = indicators.find((i) => i.code === indicator);
  const totalPop = regions.reduce((s, r) => s + (r.population || 0), 0);

  // Filter by indicator code AND geography level
  const chartData = useMemo(() => {
    const filtered = data
      .filter((d) => d.geography_level === geographyLevel)
      .filter((d) => d.indicator_code === indicator); 

    // Group by geography name (in case of duplicates)
    const grouped = filtered.reduce((acc: Record<string, number>, d) => {
      const name = d.geography_name || d.geography_code || 'Unknown';
      acc[name] = (acc[name] || 0) + Number(d.value);
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value: Number(value),
      code: filtered.find((d) => (d.geography_name || d.geography_code) === name)?.geography_code || '',
    }));
  }, [data, geographyLevel, indicator]);

  // Sort and filter table data
  const tableData = useMemo(() => {
    let filtered = data;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          (d.geography_name || '').toLowerCase().includes(term) ||
          (d.geography_code || '').toLowerCase().includes(term)
      );
    }
    return filtered.sort((a, b) => {
      const aVal = Number(a[sortField]) || 0;
      const bVal = Number(b[sortField]) || 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [data, searchTerm, sortField, sortOrder]);

  // Get top 5 for summary
  const top5 = useMemo(() => {
    return [...chartData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [chartData]);

  // Statistics calculations
  const stats = useMemo(() => {
    const values = chartData.map((d) => d.value);
    if (values.length === 0) {
      return { total: 0, max: 0, min: 0, avg: 0, maxItem: null, minItem: null, count: 0 };
    }
    const total = values.reduce((s, v) => s + v, 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = total / values.length;
    const maxItem = chartData.find((d) => d.value === max);
    const minItem = chartData.find((d) => d.value === min);
    return {
      total,
      max,
      min,
      avg,
      maxItem,
      minItem,
      count: chartData.length,
    };
  }, [chartData]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading && !data.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cm-green mx-auto"></div>
          <p className="mt-4 text-cm-muted">Loading data...</p>
        </div>
      </div>
    );
  }

  if (err) return <div className="card p-6 text-cm-red">⚠️ {err}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-cm-green" />
          Data Explorer
        </h1>
        <p className="text-cm-muted">
          Browse and visualize Cameroon census data across regions, departments, and districts.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-cm-muted text-xs uppercase">
            <MapPin className="w-4 h-4" /> Regions
          </div>
          <div className="text-3xl font-bold mt-1 text-cm-green">{regions.length}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-cm-muted text-xs uppercase">
            <Users className="w-4 h-4" /> Total Population
          </div>
          <div className="text-3xl font-bold mt-1 text-cm-red">{formatNumber(totalPop)}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-cm-muted text-xs uppercase">
            <Database className="w-4 h-4" /> Indicators
          </div>
          <div className="text-3xl font-bold mt-1 text-cm-yellow">{indicators.length}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-cm-muted text-xs uppercase">
            <TrendingUp className="w-4 h-4" /> Data Points
          </div>
          <div className="text-3xl font-bold mt-1 text-cm-green">{data.length}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-cm-muted uppercase font-medium mb-1">Indicator</label>
            <select
              className="input w-full"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
            >
              {indicators.map((i) => (
                <option key={i.code} value={i.code}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs text-cm-muted uppercase font-medium mb-1">Year</label>
            <select
              className="input w-full"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-cm-muted uppercase font-medium mb-1">Level</label>
            <select
              className="input w-full"
              value={geographyLevel}
              onChange={(e) => setGeographyLevel(e.target.value)}
            >
              <option value="region">Region</option>
              <option value="department">Department</option>
              <option value="district">District</option>
            </select>
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const resp = await api.get('/export', {
                    params: { indicator, year, format: 'csv' },
                    responseType: 'blob',
                  });
                  const blob = new Blob([resp.data], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `census-export-${indicator}-${year}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                } catch (e: any) {
                  console.error('Export failed', e);
                  setErr(e.response?.data?.error?.message || 'Export failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="btn-yellow flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Indicator Info */}
        {currentIndicator && (
          <div className="mt-3 p-3 bg-cm-ink/50 rounded text-sm text-cm-muted">
            <span className="font-medium text-white">{currentIndicator.name}</span>
            {' — '}
            {currentIndicator.description || 'No description available'}
            {' • Unit: '}
            <span className="text-cm-yellow">{currentIndicator.unit}</span>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {stats.count > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="card p-3 text-center">
            <div className="text-xs text-cm-muted">Total</div>
            <div className="text-lg font-bold text-cm-green">{formatNumber(stats.total)}</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xs text-cm-muted">Average</div>
            <div className="text-lg font-bold text-white">{formatNumber(stats.avg)}</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xs text-cm-muted">Highest</div>
            <div className="text-lg font-bold text-cm-yellow">{formatNumber(stats.max)}</div>
            <div className="text-xs text-cm-muted">{stats.maxItem?.name || '-'}</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xs text-cm-muted">Lowest</div>
            <div className="text-lg font-bold text-cm-red">{formatNumber(stats.min)}</div>
            <div className="text-xs text-cm-muted">{stats.minItem?.name || '-'}</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xs text-cm-muted">Data Points</div>
            <div className="text-lg font-bold text-white">{stats.count}</div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cm-green" />
            {currentIndicator?.name || 'Indicator'} by {geographyLevel}
          </h3>
          <div className="flex items-center gap-2 text-xs text-cm-muted">
            <span>{chartData.length} {geographyLevel}s</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid stroke="#1d2a25" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#6b8079" fontSize={11} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6b8079"
                  fontSize={11}
                  width={120}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ background: '#101815', border: '1px solid #1d2a25' }}
                  formatter={(value: any) => [formatNumber(value), currentIndicator?.unit || '']}
                />
                <Bar dataKey="value" fill="#007a5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#101815', border: '1px solid #1d2a25' }}
                  formatter={(value: any) => [formatNumber(value), currentIndicator?.unit || '']}
                />
                
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 5 Summary */}
      {top5.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            🏆 Top 5 {geographyLevel}s by {currentIndicator?.name || 'Value'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {top5.map((item, index) => (
              <div key={index} className="text-center p-2 bg-cm-ink/30 rounded">
                <div className="text-2xl font-bold text-cm-yellow">#{index + 1}</div>
                <div className="font-medium text-sm truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="text-cm-green font-bold">{formatNumber(item.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-cm-line flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-bold">Raw Data</h3>
            <span className="text-xs text-cm-muted">{data.length} records</span>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input py-1 px-3 text-sm w-40"
            />
            <button
              onClick={() => setShowTable(!showTable)}
              className="text-sm text-cm-muted hover:text-white flex items-center gap-1"
            >
              {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showTable ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {showTable && (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-cm-ink sticky top-0">
                <tr>
                  <th
                    className="text-left p-3 text-cm-muted text-xs uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort('geography_name')}
                  >
                    {geographyLevel} {sortField === 'geography_name' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-left p-3 text-cm-muted text-xs uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort('indicator_name')}
                  >
                    Indicator {sortField === 'indicator_name' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-left p-3 text-cm-muted text-xs uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort('year')}
                  >
                    Year {sortField === 'year' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 text-cm-muted text-xs uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort('value')}
                  >
                    Value {sortField === 'value' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 text-cm-muted text-xs uppercase">Unit</th>
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0, 200).map((d, i) => (
                  <tr key={i} className="border-t border-cm-line hover:bg-cm-ink/30 transition-colors">
                    <td className="p-3 font-medium">{d.geography_name || d.geography_code}</td>
                    <td className="p-3 text-cm-muted">{d.indicator_name}</td>
                    <td className="p-3">{d.year}</td>
                    <td className="p-3 text-right font-mono">{Number(d.value).toLocaleString()}</td>
                    <td className="p-3 text-cm-muted">{d.unit}</td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-cm-muted">
                      No data found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!showTable && (
          <div className="p-4 text-center text-cm-muted text-sm">
            Click <span className="text-cm-yellow">Show</span> to view raw data table
          </div>
        )}
      </div>
    </div>
  );
}