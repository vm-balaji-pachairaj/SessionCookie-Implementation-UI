"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ShieldIcon,
  SearchIcon,
  FilterIcon,
  ChevronDownIcon,
  LogOutIcon,
} from "@/components/ui/Icons";
import { Avatar } from "@/components/ui/Avatar";

export interface ScanTagNavbarProps {
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

  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const categories = [
    "All RBAC Objects",
    "User Roles (g3)",
    "Policy Bundles (g)",
    "Section Permissions (p)",
    "Menu Navigation (p2)",
    "Field Permissions (p3)",
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(e.target as Node)
      ) {
        setCategoryDropdownOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery, searchCategory);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-neutral-200/80 bg-white px-5 shadow-2xs">
      {/* Left: Sidebar Toggle & Brand Shield */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          title="Toggle navigation"
          aria-label="Toggle navigation"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Brand Shield & Casbin RBAC Portal Title (Theme Color #C81E1E) */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C81E1E] text-white shadow-2xs">
            <ShieldIcon size={16} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider text-[#C81E1E]">
                CASBIN
              </span>
              <span className="rounded bg-red-100 px-1 py-0.2 text-[9px] font-black text-[#C81E1E]">
                RBAC
              </span>
            </div>
            <span className="text-[10px] font-extrabold tracking-widest text-neutral-700">
              ACCESS CONTROL PORTAL
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global RBAC Search Capsule */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex flex-1 max-w-xl mx-6 items-center rounded-xl border border-neutral-200 bg-neutral-50/60 p-1 shadow-2xs focus-within:border-neutral-400 focus-within:bg-white transition-all"
      >
        {/* Category selector */}
        <div className="relative" ref={categoryMenuRef}>
          <button
            type="button"
            onClick={() => setCategoryDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 border border-neutral-200 shadow-2xs hover:bg-neutral-50 transition"
          >
            <span>{searchCategory}</span>
            <ChevronDownIcon size={12} className="text-neutral-400" />
          </button>

          {categoryDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-52 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSearchCategory(cat);
                    setCategoryDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs font-medium transition hover:bg-neutral-50 ${
                    searchCategory === cat
                      ? "bg-red-50 text-[#C81E1E] font-bold"
                      : "text-neutral-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="relative flex-1 px-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search role, policy bundle, module, permission rule..."
            className="w-full bg-transparent text-xs text-neutral-800 placeholder-neutral-400 outline-none"
          />
        </div>

        {/* Filters button */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 border-l border-neutral-200 transition"
        >
          <FilterIcon size={13} />
          <span className="text-[11px]">Filters</span>
        </button>

        {/* Search button in Theme Crimson (#C81E1E) */}
        <button
          type="submit"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C81E1E] text-white shadow-2xs hover:bg-[#B91C1C] transition shrink-0 ml-1"
          title="Search"
        >
          <SearchIcon size={14} />
        </button>
      </form>

      {/* Right: User Profile Pill with Theme Accent */}
      <div className="relative" ref={profileMenuRef}>
        <button
          type="button"
          onClick={() => setProfileDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-3 shadow-2xs hover:bg-neutral-50 transition cursor-pointer"
        >
          {/* Avatar with theme color ring */}
          <Avatar
            name={username}
            size="sm"
            withRing
            ringColor="theme"
          />

          {/* User Details */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-neutral-900 leading-tight">
              {username}
            </span>
            <span className="text-[10px] font-semibold text-[#C81E1E]">
              {roleName}
            </span>
          </div>

          <ChevronDownIcon size={13} className="text-neutral-400" />
        </button>

        {profileDropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="border-b border-neutral-100 px-3 py-2 bg-neutral-50/50 rounded-xl mb-1">
              <p className="text-xs font-bold text-neutral-900">{username}</p>
              <p className="text-[11px] font-semibold text-[#C81E1E]">{roleName}</p>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <LogOutIcon size={14} />
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
