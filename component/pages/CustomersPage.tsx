"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  type Permission,
  type FieldPermission,
  hasFieldPermission,
} from "@/lib/permissions";

interface CustomerItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
}

interface CustomersPageProps {
  activeKey?: string;
  permissions?: Permission[];
  fieldPermissions?: FieldPermission[];
}

const API_BASE = "http://localhost:5000/api";

export default function CustomersPage({
  activeKey = "customer_list",
  permissions = [],
  fieldPermissions = [],
}: CustomersPageProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Field-level permissions checks (P3)
  const canViewEmail =
    hasFieldPermission(fieldPermissions, "email") ||
    hasFieldPermission(fieldPermissions, "field_customer_email");
  const canViewPhone =
    hasFieldPermission(fieldPermissions, "phone") ||
    hasFieldPermission(fieldPermissions, "field_customer_phone");
  const canViewStatus =
    hasFieldPermission(fieldPermissions, "status") ||
    hasFieldPermission(fieldPermissions, "field_customer_status");
  const canViewActions =
    hasFieldPermission(fieldPermissions, "actions") ||
    hasFieldPermission(fieldPermissions, "field_customer_actions");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/customers`, {
        withCredentials: true,
      });
      setCustomers(res.data?.data || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError(
          err.response.data?.message ||
            "Access Denied: You lack the Casbin policy needed for this resource."
        );
      } else {
        // Fallback demo data
        setCustomers([
          { id: "1", name: "John Doe", email: "john@acme.com", phone: "+1-555-0101", status: "Active" },
          { id: "2", name: "Jane Smith", email: "jane@globaltech.com", phone: "+1-555-0102", status: "Active" },
          { id: "3", name: "Robert Johnson", email: "rjohnson@nexus.com", phone: "+1-555-0103", status: "Pending" },
          { id: "4", name: "Emily Davis", email: "emily@summithealth.com", phone: "+1-555-0104", status: "Active" },
          { id: "5", name: "Michael Brown", email: "mbrown@horizon.com", phone: "+1-555-0105", status: "Inactive" },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
              Menu: Sales
            </span>
            <span className="text-slate-300">•</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Section: Customers
            </span>
            <span className="text-slate-300">•</span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
              Menu: Customer Directory
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Enterprise customer records with P3 field protection on sensitive contact fields.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCustomers}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center">
          <h3 className="text-sm font-bold text-red-900">Access Restricted</h3>
          <p className="mt-1 text-xs text-red-700 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Customers
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {customers.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Accounts
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {customers.filter((c) => c.status === "Active").length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending / Inactive
          </span>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {customers.filter((c) => c.status !== "Active").length}
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or email..."
            className="w-full sm:max-w-xs rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#C81E1E]"
          />
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                canViewEmail ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              Email: {canViewEmail ? "Granted" : "Restricted (P3)"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                canViewPhone ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              Phone: {canViewPhone ? "Granted" : "Restricted (P3)"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F9FAFC] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Phone</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading customers…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                    <td className="px-6 py-4">
                      {canViewEmail ? (
                        <span className="text-slate-600 font-mono text-[11px]">{c.email}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          <span>🔒</span>
                          <span>Hidden (P3)</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canViewPhone ? (
                        <span className="text-slate-600 font-mono text-[11px]">{c.phone}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          <span>🔒</span>
                          <span>Hidden (P3)</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canViewStatus ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            c.status === "Active"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.status}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canViewActions ? (
                        <button
                          type="button"
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View Details
                        </button>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                          Read-only
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
