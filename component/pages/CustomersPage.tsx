"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  type Permission,
  type FieldPermission,
  hasFieldPermission,
} from "@/lib/permissions";
import { RefreshIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Sales</Badge>
            <span className="text-neutral-300">•</span>
            <Badge variant="neutral">Customers</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            Customer Directory
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Customer accounts with field-level Casbin (P3) permission enforcement.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchCustomers}
          isLoading={loading}
          leftIcon={<RefreshIcon size={14} />}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-xs text-red-700">
          <p className="font-bold">Access Restricted</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* Metrics Cards (Restrained Greyish Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Total Accounts
          </span>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {customers.length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Active Accounts
          </span>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {customers.filter((c) => c.status === "Active").length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Pending / Inactive
          </span>
          <div className="mt-1 text-2xl font-bold text-neutral-600">
            {customers.filter((c) => c.status !== "Active").length}
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 px-6 py-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or email…"
            className="w-full sm:max-w-xs rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
          />
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="neutral" dot={canViewEmail}>
              Email: {canViewEmail ? "Granted" : "Restricted (P3)"}
            </Badge>
            <Badge variant="neutral" dot={canViewPhone}>
              Phone: {canViewPhone ? "Granted" : "Restricted (P3)"}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Phone</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    Loading customers…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-neutral-900">{c.name}</td>
                    <td className="px-6 py-4">
                      {canViewEmail ? (
                        <span className="text-neutral-700 font-mono text-[11px]">{c.email}</span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                          🔒 Masked (P3)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canViewPhone ? (
                        <span className="text-neutral-700 font-mono text-[11px]">{c.phone}</span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                          🔒 Masked (P3)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canViewStatus ? (
                        <Badge variant={c.status === "Active" ? "success" : "neutral"} dot>
                          {c.status}
                        </Badge>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canViewActions ? (
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Read-only</span>
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
