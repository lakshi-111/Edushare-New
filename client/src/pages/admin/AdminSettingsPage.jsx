import { useState } from 'react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    enableSignups: true,
    moderationMode: false,
    lowQualityChecks: true,
    emailAlerts: true
  });

  function toggle(key) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-600">Admin Settings</h2>
            <p className="mt-2 text-sm text-slate-500">Configure system behavior and security controls.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">General Settings</h3>
        <div className="mt-4 space-y-3">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="font-medium text-slate-800">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</p>
                <p className="text-xs text-slate-500">{value ? 'Enabled' : 'Disabled'}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${value ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                type="button"
              >
                {value ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
