import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Save, RefreshCw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface Settings {
  rate_limits: {
    NGO_DEVELOPER: number;
    NGO_DATA_ANALYST: number;
    NGO_PROJECT_MANAGER: number;
    RESEARCHER: number;
    JOURNALIST: number;
  };
  cache_ttl_seconds: number;
  enable_registration: boolean;
  require_email_verification: boolean;
  max_results_per_page: number;
  session_timeout_minutes: number;
}

const DEFAULT_SETTINGS: Settings = {
  rate_limits: {
    NGO_DEVELOPER: 2000,
    NGO_DATA_ANALYST: 1000,
    NGO_PROJECT_MANAGER: 500,
    RESEARCHER: 200,
    JOURNALIST: 200,
  },
  cache_ttl_seconds: 3600,
  enable_registration: true,
  require_email_verification: true,
  max_results_per_page: 100,
  session_timeout_minutes: 60,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        console.log('📥 Settings loaded:', response.data);
        
        // Merge with defaults (in case some settings are missing)
        const loadedSettings = response.data.data || {};
        setSettings({
          ...DEFAULT_SETTINGS,
          ...loadedSettings,
          rate_limits: {
            ...DEFAULT_SETTINGS.rate_limits,
            ...(loadedSettings.rate_limits || {}),
          },
        });
      } catch (err) {
        console.error('Failed to load settings:', err);
        // Use defaults if API fails
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/admin/settings', settings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateRateLimit = (key: keyof Settings['rate_limits'], value: number) => {
    setSettings(prev => ({
      ...prev,
      rate_limits: {
        ...prev.rate_limits,
        [key]: value,
      },
    }));
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cm-green mx-auto"></div>
          <p className="mt-4 text-cm-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-cm-muted">Configure system parameters and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="card p-6 space-y-6">
        {/* Rate Limits Section */}
        <div>
          <h3 className="font-bold text-white">Rate Limits</h3>
          <p className="text-sm text-cm-muted">Configure monthly request limits per user type</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.rate_limits).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-cm-ink/50 rounded-lg">
                <span className="text-sm text-white">{key.replace('_', ' ')}</span>
                <input
                  type="number"
                  className="input w-32 text-right"
                  value={value}
                  onChange={(e) => updateRateLimit(key as keyof Settings['rate_limits'], Number(e.target.value))}
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Cache Settings */}
        <div className="border-t border-cm-line pt-6">
          <h3 className="font-bold text-white">Cache Settings</h3>
          <p className="text-sm text-cm-muted">Configure Redis cache expiration times</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-cm-ink/50 rounded-lg">
              <span className="text-sm text-white">Data Cache TTL (seconds)</span>
              <input
                type="number"
                className="input w-32 text-right"
                value={settings.cache_ttl_seconds}
                onChange={(e) => updateSetting('cache_ttl_seconds', Number(e.target.value))}
                min="60"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-cm-ink/50 rounded-lg">
              <span className="text-sm text-white">Max Results Per Page</span>
              <input
                type="number"
                className="input w-32 text-right"
                value={settings.max_results_per_page}
                onChange={(e) => updateSetting('max_results_per_page', Number(e.target.value))}
                min="10"
                max="1000"
              />
            </div>
          </div>
        </div>

        {/* System Configuration */}
        <div className="border-t border-cm-line pt-6">
          <h3 className="font-bold text-white">System Configuration</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-cm-ink/50 rounded-lg">
              <span className="text-sm text-white">Enable New Registrations</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.enable_registration}
                  onChange={(e) => updateSetting('enable_registration', e.target.checked)}
                />
                <div className="w-11 h-6 bg-cm-ink peer-focus:ring-2 peer-focus:ring-cm-green rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cm-green"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-cm-ink/50 rounded-lg">
              <span className="text-sm text-white">Require Email Verification</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.require_email_verification}
                  onChange={(e) => updateSetting('require_email_verification', e.target.checked)}
                />
                <div className="w-11 h-6 bg-cm-ink peer-focus:ring-2 peer-focus:ring-cm-green rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cm-green"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-cm-ink/50 rounded-lg">
              <span className="text-sm text-white">Session Timeout (minutes)</span>
              <input
                type="number"
                className="input w-32 text-right"
                value={settings.session_timeout_minutes}
                onChange={(e) => updateSetting('session_timeout_minutes', Number(e.target.value))}
                min="5"
                max="1440"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="border-t border-cm-line pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-400">Danger Zone</h4>
              <p className="text-sm text-cm-muted">These actions are irreversible. Proceed with caution.</p>
              <div className="mt-3 flex gap-3">
                <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
                  Clear All Cache
                </button>
                <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
                  Reset System
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}