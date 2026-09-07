"use client";

import React, { useState } from "react";
import {
  type Permission,
  type FieldPermission,
  hasFieldPermission,
} from "@/lib/permissions";

interface SettingsPageProps {
  activeKey?: string;
  permissions?: Permission[];
  fieldPermissions?: FieldPermission[];
}

export default function SettingsPage({
  activeKey = "general_settings",
  permissions = [],
  fieldPermissions = [],
}: SettingsPageProps) {
  const [theme, setTheme] = useState("Light Enterprise");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [saved, setSaved] = useState(false);

  // Field permissions
  const canModifySecurity =
    hasFieldPermission(fieldPermissions, "security_settings") ||
    hasFieldPermission(fieldPermissions, "field_general_settings_theme");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
              Menu: Settings
            </span>
            <span className="text-slate-300">•</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Section: {activeKey === "access_control" ? "Access Control" : activeKey === "notifications" ? "Notifications" : "General"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            System & Security Settings
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Configure system defaults and audit thresholds governed by Casbin policies.
          </p>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          ✓ Settings saved successfully.
        </div>
      )}

      {/* Settings Form Card */}
      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Application Preferences</h2>
          <p className="text-xs text-slate-500">Manage display and interface preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Portal Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#C81E1E]"
            >
              <option value="Light Enterprise">Light Enterprise (Default)</option>
              <option value="High Contrast">High Contrast Accessibility</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Audit Logging
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="checkbox"
                checked={auditLogging}
                onChange={(e) => setAuditLogging(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#C81E1E] focus:ring-[#C81E1E]"
              />
              <span className="text-xs text-slate-700 font-medium">
                Record all Casbin authorization decisions in audit_rule table
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-sm font-bold text-slate-900">Notification Alerts</h2>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#C81E1E] focus:ring-[#C81E1E]"
            />
            <span className="text-xs text-slate-700 font-medium">
              Send email alerts on critical RBAC policy modification
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-[#C81E1E] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#B91C1C] transition"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
