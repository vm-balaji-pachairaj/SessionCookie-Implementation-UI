"use client";

import { useEffect, useState } from "react";
import { RefreshIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

type TokenData = {
  sub?: string | number;
  username?: string;
  type?: string;
  role_id?: string;
  user_role_mapping_id?: string;
  userDetails?: {
    nt_id?: string;
    userDetails?: string;
    role_name?: string;
    short_name?: string;
    is_active?: boolean;
  };
};

export default function CurrentUserToken() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentUser() {
      try {
        setLoading(true);

        const response = await fetch("http://localhost:5000/thi", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch current user");
        }

        const data = await response.json();

        if (!cancelled) setTokenData(data.tokenData);
      } catch (error) {
        console.error("Failed to fetch token data:", error);
        if (!cancelled) setTokenData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCurrentUser();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  return (
    <div className="w-full max-w-xl mx-auto my-6 px-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              Active Token Session
            </h3>
            <p className="text-xs text-neutral-500">
              Decoded claims from your HttpOnly cookie
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={loading}
            isLoading={loading}
            leftIcon={<RefreshIcon size={14} />}
          >
            Refresh
          </Button>
        </div>

        {/* Content */}
        {loading && !tokenData ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Fetching session token claims…
          </div>
        ) : !tokenData ? (
          <div className="py-8 text-center text-xs text-red-500">
            No active session token found
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 text-xs">
            <InfoRow label="Subject (User ID)" value={tokenData.sub} />
            <InfoRow label="Username" value={tokenData.username} />
            <InfoRow label="NT ID" value={tokenData.userDetails?.nt_id} />
            <InfoRow label="Role" value={tokenData.userDetails?.role_name} />
            <InfoRow label="Short Name" value={tokenData.userDetails?.short_name} />
            <InfoRow label="Role ID" value={tokenData.role_id} />
            <InfoRow label="Role Mapping ID" value={tokenData.user_role_mapping_id} />
            <InfoRow label="Token Type" value={tokenData.type} />
            <InfoRow
              label="Active Status"
              value={tokenData.userDetails?.is_active ? "Active" : "Inactive"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="font-semibold text-neutral-500">{label}</span>
      <span className="font-mono text-neutral-800 font-medium">
        {value ?? "—"}
      </span>
    </div>
  );
}
