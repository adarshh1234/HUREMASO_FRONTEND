import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Smartphone, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  WifiOff, 
  RefreshCw,
  Mail,
  Phone,
  Layers,
  Sparkles
} from 'lucide-react';
import { AppSettingsConfig } from '../../../types/employeeApp.types';

interface AppSettingsConfigTabProps {
  settings: AppSettingsConfig | null;
  loading: boolean;
  onFetchSettings: () => Promise<void>;
  onUpdateSettings: (data: Partial<AppSettingsConfig>) => Promise<any>;
}

export const AppSettingsConfigTab: React.FC<AppSettingsConfigTabProps> = ({
  settings,
  loading,
  onFetchSettings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<AppSettingsConfig>({
    appName: 'Huremaso Mobile HR',
    currentVersion: 'v2.4.0',
    minimumSupportedVersion: 'v2.0.0',
    maintenanceMode: false,
    maintenanceMessage: 'The employee portal is undergoing routine maintenance. Please try again shortly.',
    forceUpdate: false,
    allowBiometricLogin: true,
    sessionTimeoutMinutes: 45,
    allowOfflineMode: true,
    maxDevicesPerUser: 2,
    allowedFeatures: {
      attendanceGeofence: true,
      pushNotifications: true,
      offlineSync: true,
      documentDownload: true,
      darkTheme: true,
      profilePhotoUpload: false,
    },
    securityPolicy: {
      passcodeExpiryDays: 90,
      blockRootedDevices: true,
      screenshotBlocked: true,
      enforceStrongPassword: true,
    },
    supportContactEmail: 'app-support@huremaso.com',
    supportContactPhone: '+1 (800) 555-0199',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onFetchSettings();
  }, [onFetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onUpdateSettings({
        ...formData,
        updatedBy: 'System Administrator',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner with Save CTA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Mobile App Parameters & Configuration</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage production versioning, runtime maintenance locks, mobile security rules, and feature flags.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* 1. Maintenance Mode Box */}
      <div className={`p-5 rounded-2xl border transition-all ${formData.maintenanceMode ? 'bg-amber-500/10 border-amber-300' : 'bg-white border-slate-200'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${formData.maintenanceMode ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Mobile App Maintenance Mode</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                When enabled, mobile users see a maintenance lockdown screen and cannot perform write operations.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.maintenanceMode}
              onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>

        {formData.maintenanceMode && (
          <div className="mt-4 pt-3 border-t border-amber-200/60">
            <label className="block text-xs font-bold text-amber-900 mb-1">Maintenance Banner Message</label>
            <input
              type="text"
              value={formData.maintenanceMessage}
              onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Versioning & Updates */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-teal-50 text-[#004848]">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Mobile Release & Version Policy</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Application Brand Title</label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current App Release</label>
                <input
                  type="text"
                  value={formData.currentVersion}
                  onChange={(e) => setFormData({ ...formData, currentVersion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Minimum Supported Version</label>
                <input
                  type="text"
                  value={formData.minimumSupportedVersion}
                  onChange={(e) => setFormData({ ...formData, minimumSupportedVersion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Enforce Hard Upgrade Dialog</p>
                  <p className="text-[11px] text-slate-500">Blocks app until user updates to latest release.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.forceUpdate}
                  onChange={(e) => setFormData({ ...formData, forceUpdate: e.target.checked })}
                  className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Mobile Security Policies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Security & Session Policies</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Inactivity Timeout (Min)</label>
                <input
                  type="number"
                  min={5}
                  max={480}
                  value={formData.sessionTimeoutMinutes}
                  onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Passcode Expiry (Days)</label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={formData.securityPolicy.passcodeExpiryDays}
                  onChange={(e) => setFormData({
                    ...formData,
                    securityPolicy: {
                      ...formData.securityPolicy,
                      passcodeExpiryDays: Number(e.target.value),
                    },
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Block Rooted & Jailbroken Devices</span>
                <input
                  type="checkbox"
                  checked={formData.securityPolicy.blockRootedDevices}
                  onChange={(e) => setFormData({
                    ...formData,
                    securityPolicy: {
                      ...formData.securityPolicy,
                      blockRootedDevices: e.target.checked,
                    },
                  })}
                  className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Block Screenshots on Sensitive Screens</span>
                <input
                  type="checkbox"
                  checked={formData.securityPolicy.screenshotBlocked}
                  onChange={(e) => setFormData({
                    ...formData,
                    securityPolicy: {
                      ...formData.securityPolicy,
                      screenshotBlocked: e.target.checked,
                    },
                  })}
                  className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Enforce Strong Alphanumeric Passcodes</span>
                <input
                  type="checkbox"
                  checked={formData.securityPolicy.enforceStrongPassword}
                  onChange={(e) => setFormData({
                    ...formData,
                    securityPolicy: {
                      ...formData.securityPolicy,
                      enforceStrongPassword: e.target.checked,
                    },
                  })}
                  className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Global Feature Switches & Support Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Mobile Feature Switches</h4>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">GPS Geofencing for Attendance Punch</span>
              <input
                type="checkbox"
                checked={formData.allowedFeatures.attendanceGeofence}
                onChange={(e) => setFormData({
                  ...formData,
                  allowedFeatures: {
                    ...formData.allowedFeatures,
                    attendanceGeofence: e.target.checked,
                  },
                })}
                className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Push Notifications via APNS / FCM</span>
              <input
                type="checkbox"
                checked={formData.allowedFeatures.pushNotifications}
                onChange={(e) => setFormData({
                  ...formData,
                  allowedFeatures: {
                    ...formData.allowedFeatures,
                    pushNotifications: e.target.checked,
                  },
                })}
                className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Offline Punch Cache & Auto-Sync</span>
              <input
                type="checkbox"
                checked={formData.allowedFeatures.offlineSync}
                onChange={(e) => setFormData({
                  ...formData,
                  allowedFeatures: {
                    ...formData.allowedFeatures,
                    offlineSync: e.target.checked,
                  },
                })}
                className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Encrypted Document Local Download</span>
              <input
                type="checkbox"
                checked={formData.allowedFeatures.documentDownload}
                onChange={(e) => setFormData({
                  ...formData,
                  allowedFeatures: {
                    ...formData.allowedFeatures,
                    documentDownload: e.target.checked,
                  },
                })}
                className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Dark Theme UI Support</span>
              <input
                type="checkbox"
                checked={formData.allowedFeatures.darkTheme}
                onChange={(e) => setFormData({
                  ...formData,
                  allowedFeatures: {
                    ...formData.allowedFeatures,
                    darkTheme: e.target.checked,
                  },
                })}
                className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Mail className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">In-App Helpdesk & Support Desk</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Support Contact Email</label>
              <input
                type="email"
                value={formData.supportContactEmail}
                onChange={(e) => setFormData({ ...formData, supportContactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Support Hotline / Toll-Free Phone</label>
              <input
                type="text"
                value={formData.supportContactPhone}
                onChange={(e) => setFormData({ ...formData, supportContactPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="font-bold text-slate-800">Support Desk Display</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                These contact details appear on the mobile login error dialog and in the "Help & Support" drawer inside the mobile application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
