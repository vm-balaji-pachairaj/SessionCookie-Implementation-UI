"use client";

import { useCallback, useEffect, useState } from "react";

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

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/thistoken", {
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

      setTokenData(data.tokenData);
    } catch (error) {
      console.error("Failed to fetch token data:", error);
      setTokenData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "600px",
        margin: "20px auto",
        padding: "0 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "24px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            Current User
          </h3>

          <button
            onClick={fetchCurrentUser}
            disabled={loading}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: loading ? "#aaa" : "#1976d2",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Loading */}
        {loading && !tokenData ? (
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              color: "#666",
            }}
          >
            Loading...
          </div>
        ) : !tokenData ? (
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              color: "#d32f2f",
            }}
          >
            No user information found
          </div>
        ) : (
          <div>
         

            <InfoRow label="NT ID" value={tokenData.userDetails?.nt_id} />

            <InfoRow label="Role" value={tokenData.userDetails?.role_name} />

            <InfoRow
              label="Short Name"
              value={tokenData.userDetails?.short_name}
            />

            <InfoRow label="Role ID" value={tokenData.role_id} />

            <InfoRow
              label="Role Mapping ID"
              value={tokenData.user_role_mapping_id}
            />

            <InfoRow label="Token Type" value={tokenData.type} />

            <InfoRow
              label="Active"
              value={tokenData.userDetails?.is_active ? "Yes" : "No"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        style={{
          width: "180px",
          fontWeight: 600,
          color: "#555",
        }}
      >
        {label}
      </div>

      <div
        style={{
          flex: 1,
          color: "#222",
          wordBreak: "break-word",
        }}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}
