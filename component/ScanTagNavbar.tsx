"use client";

import React, { useState } from "react";

interface ScanTagNavbarProps {
  onToggleSidebar?: () => void;
  username?: string;
  roleName?: string;
  onSearch?: (query: string, category: string) => void;
  onLogout?: () => void;
}

export default function ScanTagNavbar({
  onToggleSidebar,
  username = "Security Admin",
  roleName = "RBAC Administrator",
  onSearch,
  onLogout,
}: ScanTagNavbarProps) {
  const [searchCategory, setSearchCategory] = useState("All RBAC Objects");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const categories = [
    "All RBAC Objects",
    "User Roles (g3)",
    "Policy Bundles (g)",
    "Section Permissions (p)",
    "Menu Navigation (p2)",
    "Field Permissions (p3)",
  ];

  const initials = username
    ? username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SA";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery, searchCategory);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs">
      {/* Left: Hamburger & Casbin RBAC Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          title="Toggle navigation"
          aria-label="Toggle navigation"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Brand Shield & Casbin RBAC Title */}
        <div className="flex items-center gap-2.5">
          {/* Crimson Red Shield with Security Key Icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C81E1E] text-white shadow-xs">
            <svg
              className="h-5 w-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.66 0 3 1.34 3 3 0 .9-.4 1.7-1 2.2V15h-4v-2.8c-.6-.5-1-1.3-1-2.2 0-1.66 1.34-3 3-3z" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black leading-tight tracking-wider text-[#C81E1E]">
                CASBIN
              </span>
              <span className="rounded bg-red-100 px-1 py-0.2 text-[9px] font-black text-[#C81E1E]">
                RBAC
              </span>
            </div>
            <span className="text-[10px] font-extrabold tracking-widest text-slate-800">
              ACCESS CONTROL PORTAL
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global RBAC Search Capsule */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex flex-1 max-w-2xl mx-6 items-center rounded-lg border border-slate-200 bg-slate-50/70 p-1 shadow-2xs focus-within:border-slate-300 focus-within:bg-white"
      >
        {/* Category selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoryDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs border border-slate-200 hover:bg-slate-50 transition"
          >
            <span>{searchCategory}</span>
            <svg
              className="h-3.5 w-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {categoryDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSearchCategory(cat);
                    setCategoryDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 ${
                    searchCategory === cat
                      ? "bg-red-50 text-[#C81E1E] font-semibold"
                      : "text-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="relative flex-1 px-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search role, policy bundle, module, permission rule..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>

        {/* Advanced Filters indicator */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 border-l border-slate-200"
        >
          <svg
            className="h-3.5 w-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <span className="text-[11px]">Filters</span>
        </button>

        {/* Search button in Crimson Red */}
        <button
          type="submit"
          className="flex h-8 w-8 items-center justify-center rounded-md bg-[#C81E1E] text-white shadow-xs hover:bg-[#B91C1C] transition shrink-0 ml-1"
          title="Search"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </form>

      {/* Right: User Profile Pill */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileDropdownOpen((prev) => !prev)}
          className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-2xs hover:bg-slate-50 transition"
        >
          {/* Circular avatar badge */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {initials}
          </div>

          {/* User Details */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold leading-tight text-slate-900">
              {username}
            </span>
            <span className="text-[10px] font-semibold text-[#C81E1E]">
              {roleName}
            </span>
          </div>

          <svg
            className="h-3.5 w-3.5 text-slate-400 ml-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {profileDropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-xs font-bold text-slate-900">{username}</p>
              <p className="text-[11px] font-semibold text-[#C81E1E]">{roleName}</p>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onLogout();
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
