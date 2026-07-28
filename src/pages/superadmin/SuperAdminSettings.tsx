/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { scaleIn } from '../../utils/motion';
import { RefreshCw, Save, Settings as SettingsIcon, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface SettingRow {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
  updatedByName?: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export const SuperAdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const knownSettings = [
    { key: 'allow_new_registrations', label: 'New Registrations', description: 'Allow students and tech leads to self-register', type: 'boolean' as const },
    { key: 'marking_scale', label: 'Marking Scale', description: 'Maximum score for task and log reviews', type: 'select' as const },
    { key: 'ask_the_team_enabled', label: 'Ask the Team', description: 'Control visibility of the Ask the Team discussion board', type: 'boolean' as const },
  ];

  const loadSettings = async () => {
    try {
      const data = await api.getSystemSettings();
      setSettings(data);
    } catch (e) {
      console.error("Failed to load system settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const getSetting = (key: string) => {
    return settings.find(s => s.key === key);
  };

  const getSettingValue = (key: string): any => {
    const setting = getSetting(key);
    if (!setting) return null;
    if (setting.value === 'true') return true;
    if (setting.value === 'false') return false;
    if (!isNaN(Number(setting.value)) && setting.value.trim() !== '') return Number(setting.value);
    return setting.value;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBooleanChange = async (key: string, newValue: boolean) => {
    const setting = getSetting(key);
    if (!setting) return;
    setSaving(key);
    try {
      await api.updateSystemSetting(key, String(newValue));
      await loadSettings();
      showToast(`Setting "${key}" updated successfully`, 'success');
    } catch (e: any) {
      showToast(e.message || `Failed to update "${key}"`, 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleSelectChange = async (key: string, newValue: string) => {
    const setting = getSetting(key);
    if (!setting) return;
    setSaving(key);
    try {
      await api.updateSystemSetting(key, newValue);
      await loadSettings();
      showToast(`Setting "${key}" updated successfully`, 'success');
    } catch (e: any) {
      showToast(e.message || `Failed to update "${key}"`, 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <motion.div {...scaleIn} className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading system settings...</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...scaleIn} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure platform-wide parameters</p>
        </div>
        <button
          onClick={loadSettings}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-950/40 rounded-lg">
              <SettingsIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Configuration</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Each setting updates immediately on change.</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {knownSettings.map((settingDef) => {
            const setting = getSetting(settingDef.key);
            const currentValue = setting ? getSettingValue(settingDef.key) : null;

            return (
              <div key={settingDef.key} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{settingDef.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{settingDef.description}</p>
                  {setting && (
                    <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
                      Last updated{setting.updatedByName ? ` by ${setting.updatedByName}` : ''} on {new Date(setting.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="min-w-[120px] flex items-center justify-end">
                  {settingDef.type === 'boolean' && (
                    <button
                      onClick={() => handleBooleanChange(settingDef.key, !currentValue)}
                      disabled={saving === settingDef.key}
                      className={`relative w-12 h-7 rounded-full transition-colors duration-200 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50 ${
                        currentValue ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                          currentValue ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  )}
                  {settingDef.type === 'select' && (
                    <select
                      value={currentValue || '1-5'}
                      onChange={(e) => handleSelectChange(settingDef.key, e.target.value)}
                      disabled={saving === settingDef.key}
                      className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="1-5">1–5 Stars</option>
                      <option value="1-10">1–10 Stars</option>
                    </select>
                  )}
                  {saving === settingDef.key && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600 ml-2" />
                  )}
                </div>
              </div>
            );
          })}
          {settings.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
              No system settings configured yet.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};


