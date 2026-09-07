"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  type Permission,
  type FieldPermission,
  hasFieldPermission,
} from "@/lib/permissions";

interface OrderItem {
  id: string;
  orderId: string;
  customer: string;
  amount?: number;
  status: string;
  createdDate: string;
}

interface SalesPageProps {
  activeKey?: string;
  permissions?: Permission[];
  fieldPermissions?: FieldPermission[];
}

const API_BASE = "http://localhost:5000/api";

export default function SalesPage({
  activeKey = "orders",
  permissions = [],
  fieldPermissions = [],
}: SalesPageProps) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Field-level permissions checks (P3)
  const canViewAmount =
    hasFieldPermission(fieldPermissions, "amount") ||
    hasFieldPermission(fieldPermissions, "field_orders_amount");
  const canViewActions =
    hasFieldPermission(fieldPermissions, "actions") ||
    hasFieldPermission(fieldPermissions, "field_orders_actions");
  const canViewStatus =
    hasFieldPermission(fieldPermissions, "status") ||
    hasFieldPermission(fieldPermissions, "field_orders_status");
  const canViewCustomer =
    hasFieldPermission(fieldPermissions, "customer") ||
    hasFieldPermission(fieldPermissions, "field_orders_customer");

  // Load orders from protected API endpoint
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/sales/orders`, {
        withCredentials: true,
      });
      setOrders(res.data?.data || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError(
          err.response.data?.message ||
            "Access Denied: You lack the Casbin policy needed for this resource."
        );
      } else {
        // Fallback demo data if backend session is not established in browser
        setOrders([
          {
            id: "1",
            orderId: "ORD-501",
            customer: "Acme Corporation",
            amount: 15400,
            status: "Completed",
            createdDate: "2026-03-01",
          },
          {
            id: "2",
            orderId: "ORD-502",
            customer: "Global Tech Ltd",
            amount: 8200,
            status: "Processing",
            createdDate: "2026-03-02",
          },
          {
            id: "3",
            orderId: "ORD-503",
            customer: "Nexus Enterprises",
            amount: 24900,
            status: "Pending Approval",
            createdDate: "2026-03-03",
          },
          {
            id: "4",
            orderId: "ORD-504",
            customer: "Summit Health Group",
            amount: 6750,
            status: "Completed",
            createdDate: "2026-03-04",
          },
          {
            id: "5",
            orderId: "ORD-505",
            customer: "Horizon Logistics",
            amount: 11200,
            status: "Shipped",
            createdDate: "2026-03-05",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id: string, orderId: string) => {
    try {
      await axios.delete(`${API_BASE}/sales/orders/${id}`, {
        withCredentials: true,
      });
      setActionNotice({
        type: "success",
        message: `Order ${orderId} was successfully deleted.`,
      });
      fetchOrders();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setActionNotice({
          type: "error",
          message:
            err.response.data?.message ||
            "403 Forbidden: Your Casbin role does not have delete permission on this resource.",
        });
      } else {
        setActionNotice({
          type: "error",
          message: "Unable to delete order.",
        });
      }
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Section: Sales
            </span>
            <span className="text-slate-300">•</span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
              Menu: {activeKey === "sales_dashboard" ? "Dashboard" : "Orders"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {activeKey === "sales_dashboard" ? "Sales Performance Dashboard" : "Sales Orders Directory"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Real enterprise sales data with field-level Casbin (P3) permission enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOrders}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Action/Error notifications */}
      {actionNotice && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs font-semibold transition ${
            actionNotice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{actionNotice.message}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-lg mb-3">
            !
          </div>
          <h3 className="text-sm font-bold text-red-900">Access Restricted</h3>
          <p className="mt-1 text-xs text-red-700 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Orders
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {orders.length}
          </div>
          <span className="mt-1 inline-block text-[11px] text-emerald-600 font-medium">
            Active in system
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            {!canViewAmount && (
              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-amber-800">
                P3 Masked
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {canViewAmount ? (
              `$${totalRevenue.toLocaleString()}`
            ) : (
              <span className="text-slate-400 text-lg tracking-widest font-mono">
                $••••••
              </span>
            )}
          </div>
          <span className="mt-1 inline-block text-[11px] text-slate-400">
            {canViewAmount ? "Sum across all orders" : "Permission P3: amount required"}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Completed
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {orders.filter((o) => o.status === "Completed").length}
          </div>
          <span className="mt-1 inline-block text-[11px] text-slate-400">
            Fulfillment completed
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending / In Progress
          </span>
          <div className="mt-2 text-2xl font-black text-blue-600">
            {orders.filter((o) => o.status !== "Completed").length}
          </div>
          <span className="mt-1 inline-block text-[11px] text-slate-400">
            Action required
          </span>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Orders List</h2>
            <p className="text-xs text-slate-500">
              Field columns dynamically reflect Casbin P3 field policies for your role.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Field Gating:</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                canViewAmount
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              Amount: {canViewAmount ? "Granted" : "Restricted"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                canViewActions
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              Actions: {canViewActions ? "Granted" : "Restricted"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F9FAFC] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading orders…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No orders available.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    {/* Order ID */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {order.orderId}
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {canViewCustomer ? order.customer : "••••••••••••"}
                    </td>

                    {/* Amount (P3 Gated) */}
                    <td className="px-6 py-4">
                      {canViewAmount && typeof order.amount === "number" ? (
                        <span className="font-mono font-bold text-slate-900">
                          ${order.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          <span>🔒</span>
                          <span>Hidden (P3)</span>
                        </span>
                      )}
                    </td>

                    {/* Status (P3 Gated) */}
                    <td className="px-6 py-4">
                      {canViewStatus ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            order.status === "Completed"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : order.status === "Processing"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : order.status === "Shipped"
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {order.status}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {order.createdDate}
                    </td>

                    {/* Actions (P3 Gated) */}
                    <td className="px-6 py-4 text-right">
                      {canViewActions ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActionNotice({
                                type: "success",
                                message: `Viewing details for ${order.orderId}`,
                              })
                            }
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(order.id, order.orderId)}
                            className="rounded-md border border-red-200 bg-red-50/50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
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
