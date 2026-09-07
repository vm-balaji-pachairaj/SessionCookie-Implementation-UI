"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PolicyResourceHierarchy from "./PolicyResourceHierarchy";

const ADMIN_API =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5000/api/admin";

interface AddPolicyToBundleModalProps {
  bundleId: number;
  bundleName: string;
  initialPtype?: "all" | "p" | "p2" | "p3";
  onClose: () => void;
  onAdded: () => void;
}

export default function AddPolicyToBundleModal({
  bundleId,
  bundleName,
  onClose,
  onAdded,
}: AddPolicyToBundleModalProps) {
  const [assignedPolicies, setAssignedPolicies] = useState<string[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing assigned policies for this bundle
  const loadExistingPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get<{ permission: string }[]>(
        `${ADMIN_API}/policy-bundles/${bundleId}/policies`
      );
      setAssignedPolicies(res.data.map((p) => p.permission));
    } catch (err) {
      console.error("Failed to load existing bundle policies:", err);
      setError("Unable to load current bundle policies.");
    } finally {
      setLoading(false);
    }
  }, [bundleId]);

  useEffect(() => {
    loadExistingPolicies();
  }, [loadExistingPolicies]);

  // Handle adding selected policies
  const handleAddSelected = async (newPolicies: string[]) => {
    if (newPolicies.length === 0) return;
    try {
      setSaving(true);
      setError("");
      const combined = Array.from(new Set([...assignedPolicies, ...newPolicies]));
      await axios.put(`${ADMIN_API}/policy-bundles/${bundleId}/policies`, {
        policyNames: combined,
      });
      onAdded();
    } catch (err: unknown) {
      console.error("Add policies to bundle error:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(String(err.response.data.message));
      } else {
        setError("Unable to add policies to bundle.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-sans"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
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
                Add Policies to Bundle
              </h3>
              <p className="text-xs text-slate-500">
                Select hierarchical resources to add to bundle{" "}
                <strong className="text-slate-800 font-bold">&ldquo;{bundleName}&rdquo;</strong>
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

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Content: Hierarchical Resource Tree */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="py-12 text-center text-xs text-slate-400">
              Loading resource hierarchy…
            </p>
          ) : (
            <PolicyResourceHierarchy
              key={`add-hierarchy-${bundleId}`}
              mode="add"
              assignedPolicies={assignedPolicies}
              selectedPolicies={selectedToAdd}
              onChange={(sel) => setSelectedToAdd(sel)}
              onAddSelected={handleAddSelected}
              isSaving={saving}
              bundleName={bundleName}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="text-xs font-semibold text-slate-500">
            {selectedToAdd.size > 0 ? (
              <span className="text-[#C81E1E] font-bold">
                {selectedToAdd.size} new policies selected
              </span>
            ) : (
              <span>Select menus, sections, or fields above to add</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAddSelected(Array.from(selectedToAdd))}
              disabled={selectedToAdd.size === 0 || saving}
              className="rounded-lg bg-[#C81E1E] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving
                ? "Adding Policies…"
                : `+ Add Selected Policies (${selectedToAdd.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
