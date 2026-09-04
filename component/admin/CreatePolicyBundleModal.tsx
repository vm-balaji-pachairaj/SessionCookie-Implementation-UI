"use client";

import { useState } from "react";
import axios from "axios";

const ADMIN_API = "http://localhost:5000/api/admin";

interface CreatePolicyBundleModalProps {
  onClose: () => void;
  onCreated: (newBundleId?: number) => void;
}

export default function CreatePolicyBundleModal({
  onClose,
  onCreated,
}: CreatePolicyBundleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Bundle name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const res = await axios.post(`${ADMIN_API}/policy-bundles`, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onCreated(res.data?.id);
    } catch (err: unknown) {
      console.error("Create bundle error:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(String(err.response.data.message));
      } else {
        setError("Failed to create policy bundle.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-[#C81E1E]">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Create Policy Bundle
              </h3>
              <p className="text-xs text-slate-500">
                Define a new bundle to group section, menu, and field permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Bundle Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Call Center Supervisor Bundle"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:ring-2 focus:ring-red-100"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this policy bundle..."
                className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="rounded-lg bg-[#C81E1E] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Bundle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
