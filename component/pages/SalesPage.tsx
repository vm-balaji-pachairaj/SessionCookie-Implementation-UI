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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Sales</Badge>
            <span className="text-neutral-300">•</span>
            <Badge variant="neutral">
              {activeKey === "sales_dashboard" ? "Overview" : "Orders"}
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            {activeKey === "sales_dashboard"
              ? "Sales Performance Dashboard"
              : "Sales Orders Directory"}
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Enterprise sales records with field-level Casbin (P3) permission enforcement.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchOrders}
          isLoading={loading}
          leftIcon={<RefreshIcon size={14} />}
        >
          Refresh
        </Button>
      </div>

      {/* Action/Error notifications */}
      {actionNotice && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs font-semibold ${
            actionNotice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{actionNotice.message}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-neutral-400 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
          <p className="font-bold">Access Restricted</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* Metric Cards (Restrained Greyish Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Total Orders
          </span>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {orders.length}
          </div>
          <span className="mt-1 inline-block text-[11px] text-neutral-500">
            Recorded in system
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Total Revenue
            </span>
            {!canViewAmount && (
              <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[9px] font-bold text-neutral-500 uppercase">
                P3 Masked
              </span>
            )}
          </div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {canViewAmount ? (
              `$${totalRevenue.toLocaleString()}`
            ) : (
              <span className="text-neutral-300 font-mono tracking-widest text-lg">
                $••••••
              </span>
            )}
          </div>
          <span className="mt-1 inline-block text-[11px] text-neutral-400">
            {canViewAmount ? "Aggregated order sum" : "Permission P3: amount required"}
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Completed
          </span>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {orders.filter((o) => o.status === "Completed").length}
          </div>
          <span className="mt-1 inline-block text-[11px] text-neutral-500">
            Fulfilled orders
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Pending / In Progress
          </span>
          <div className="mt-1 text-2xl font-bold text-neutral-700">
            {orders.filter((o) => o.status !== "Completed").length}
          </div>
          <span className="mt-1 inline-block text-[11px] text-neutral-400">
            Action required
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Orders List</h2>
            <p className="text-xs text-neutral-500">
              Columns reflect dynamic Casbin P3 field policies.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="neutral" dot={canViewAmount}>
              Amount: {canViewAmount ? "Granted" : "Restricted"}
            </Badge>
            <Badge variant="neutral" dot={canViewActions}>
              Actions: {canViewActions ? "Granted" : "Restricted"}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    Loading orders…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No orders available.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                      {order.orderId}
                    </td>

                    <td className="px-6 py-4 font-semibold text-neutral-800">
                      {canViewCustomer ? order.customer : "••••••••••••"}
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                      {canViewAmount && typeof order.amount === "number" ? (
                        `$${order.amount.toLocaleString()}`
                      ) : (
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                          🔒 Masked
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {canViewStatus ? (
                        <Badge
                          variant={order.status === "Completed" ? "success" : "neutral"}
                          dot
                        >
                          {order.status}
                        </Badge>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-neutral-500 font-mono text-[11px]">
                      {order.createdDate}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {canViewActions ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setActionNotice({
                                type: "success",
                                message: `Viewing details for ${order.orderId}`,
                              })
                            }
                          >
                            View
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(order.id, order.orderId)}
                          >
                            Delete
                          </Button>
                        </div>
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
