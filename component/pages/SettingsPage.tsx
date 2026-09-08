"use client";

import React, { useState } from "react";
import {
  type Permission,
  type FieldPermission,
  hasFieldPermission,
} from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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
  const [theme, setTheme] = useState("Light Minimalist");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Menu: Settings</Badge>
            <span className="text-neutral-300">•</span>
            <Badge variant="neutral">
              Section: {activeKey === "access_control" ? "Access Control" : activeKey === "notifications" ? "Notifications" : "General"}
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            System &amp; Interface Preferences
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Configure application defaults and audit logging thresholds.
          </p>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs font-semibold text-neutral-800">
          ✓ Settings saved successfully.
        </div>
      )}

      {/* Settings Form */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-6 max-w-2xl"
      >
        <div>
          <h2 className="text-sm font-bold text-neutral-900">
            Interface Preferences
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage display and accessibility theme options.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Theme Style
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs font-semibold text-neutral-800 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
            >
              <option value="Light Minimalist">Light Minimalist (Default White)</option>
              <option value="High Contrast">High Contrast Accessibility</option>
            </select>
          </div>

          <div className="pt-3 border-t border-neutral-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={auditLogging}
                onChange={(e) => setAuditLogging(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-800">
                  Enable Audit Rule Tracking
                </span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Record all Casbin authorization decisions in audit_rule table
                </p>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-neutral-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-800">
                  Notification Alerts
                </span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Send email notifications on critical RBAC policy modification
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-5 flex justify-end">
          <Button type="submit" variant="primary" size="md">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
