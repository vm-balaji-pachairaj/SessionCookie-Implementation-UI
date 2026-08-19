"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../common";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/login", {
        username,
        password,
      });

      // Backend sets:
      // access_token
      // refresh_token
      //
      // Both are HttpOnly cookies.

      // Clear any pending credentials (cleanup) and continue
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pending_login_credentials");
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Error response:", error?.response);

      // If backend reports an existing session, redirect to continue-session
      if (
        error?.response?.status === 409 &&
        error?.response?.data?.code === "USER_ALREADY_LOGGED_IN"
      ) {
        // Save credentials temporarily so the continue flow can post them.
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              "pending_login_credentials",
              JSON.stringify({ username, password })
            );
          } catch (e) {
            console.error("Failed to save pending credentials:", e);
          }
        }

        router.push("/continue-session");
        return;
      }

      const message =
        error?.response?.data?.message ||
        "Unable to login. Please check your credentials.";

      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="rounded-2xl border border-white/10 bg-slate-800/80 backdrop-blur-xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white text-xl font-bold">L</span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                disabled={loading}
                className="w-full rounded-lg border border-slate-600 bg-slate-700/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-lg border border-slate-600 bg-slate-700/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
              />
            </div>

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 text-center">
            <p className="text-xs text-slate-500">Secure authentication</p>
          </div>
        </div>
      </div>
    </main>
  );
}
