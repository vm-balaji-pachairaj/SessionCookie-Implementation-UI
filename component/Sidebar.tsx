"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store/store";
import {
  HomeIcon,
  SearchIcon,
  UsersIcon,
  HeartIcon,
  PaperPlaneIcon,
  GridIcon,
  SettingsIcon,
  UserIcon,
  ShieldIcon,
  LogOutIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@/components/ui/Icons";
import { Avatar } from "@/components/ui/Avatar";

// Static bottom links
const STATIC_LINKS = [
  { key: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
  { key: "profile", label: "Profile", icon: <UserIcon size={18} /> },
];

// Helper to map menu keys to sleek icons
function getNavIcon(key: string, customIcon?: string) {
  const norm = key.toLowerCase().replace(/[\s-]+/g, "_");
  if (norm.includes("dashboard")) return <HomeIcon size={18} />;
  if (norm.includes("search")) return <SearchIcon size={18} />;
  if (norm.includes("user") || norm.includes("role") || norm.includes("permission"))
    return <UsersIcon size={18} />;
  if (norm.includes("review")) return <HeartIcon size={18} />;
  if (norm.includes("sales") || norm.includes("order")) return <GridIcon size={18} />;
  if (norm.includes("customer")) return <UsersIcon size={18} />;
  if (norm.includes("report") || norm.includes("audit")) return <GridIcon size={18} />;
  if (norm.includes("pubsub") || norm.includes("message"))
    return <PaperPlaneIcon size={18} />;
  if (norm.includes("setting")) return <SettingsIcon size={18} />;

  if (customIcon && customIcon.startsWith("/")) {
    return <img src={customIcon} alt="" className="h-4 w-4 object-contain" />;
  }
  return <GridIcon size={18} />;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface RoleOption {
  user_role_mapping_id: string;
  role_id: string;
  nt_id: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;

  role_master?: {
    role_name?: string;
    short_name?: string;
  };
}

export interface SidebarProps {
  username?: string;
  ntId?: string;
  currentRoleName?: string;
  selectedRoleId?: string | null;
  roles?: RoleOption[];
  onRoleChange?: (role: RoleOption) => void;
  activeKey?: string;
  onNavClick?: (key: string) => void;
  onLogout: () => void;
  loggingOut?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({
  username,
  ntId,
  currentRoleName,
  selectedRoleId,
  roles = [],
  onRoleChange,
  activeKey = "dashboard",
  onNavClick,
  onLogout,
  loggingOut = false,
  collapsed: externalCollapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed =
    externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse =
    onToggleCollapsed || (() => setInternalCollapsed((c) => !c));
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);

  const menus = useSelector((state: RootState) => state.menu.menus);

  // Backend menus decide what appears in the sidebar
  const navItems = menus.map((menu) => ({
    key: menu.key,
    label: menu.displayName || menu.key.replace(/_/g, " "),
    icon: getNavIcon(menu.key, menu.icon),
  }));

  // Close role menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        roleMenuRef.current &&
        !roleMenuRef.current.contains(e.target as Node)
      ) {
        setRoleMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-neutral-200/80 bg-white transition-all duration-300 ${
        collapsed ? "w-18" : "w-64"
      } sticky top-0 shrink-0 z-30 select-none`}
    >
      {/* Brand Header with Theme Color (#C81E1E) */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-100 px-4">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Theme shield logo */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C81E1E] text-white shadow-2xs shrink-0">
              <ShieldIcon size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-black tracking-wider text-neutral-900 uppercase">
                Casbin Portal
              </span>
              <span className="text-[10px] font-bold text-[#C81E1E] tracking-tight">
                RBAC Security Suite
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#C81E1E] text-white shadow-2xs">
            <ShieldIcon size={16} />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            toggleCollapse();
            setRoleMenuOpen(false);
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition ${
            collapsed ? "hidden" : "ml-auto"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeftIcon size={14} />
        </button>
      </div>

      {/* When collapsed, small expand button at top */}
      {collapsed && (
        <div className="flex justify-center py-2 border-b border-neutral-100">
          <button
            type="button"
            onClick={() => {
              toggleCollapse();
              setRoleMenuOpen(false);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition"
            title="Expand sidebar"
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.key === activeKey;

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onNavClick?.(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-red-50/80 text-[#C81E1E] font-bold"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  {/* Active theme color pill indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#C81E1E]" />
                  )}

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#C81E1E] text-white shadow-2xs"
                        : "text-neutral-500 group-hover:text-neutral-900"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="truncate capitalize text-left">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-3 border-t border-neutral-100" />

        {/* Static Links */}
        <ul className="space-y-1">
          {STATIC_LINKS.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onNavClick?.(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-neutral-100 text-neutral-900 font-bold"
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400">
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="truncate capitalize text-left">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Card + Role Switcher (Theme Accent `#C81E1E`) */}
      <div
        className="border-t border-neutral-100 bg-white px-3 py-3 relative"
        ref={roleMenuRef}
      >
        {/* Role popover */}
        {roleMenuOpen && !collapsed && roles.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5 bg-neutral-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Switch Active Role
              </span>
              <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-bold text-[#C81E1E]">
                Casbin g3
              </span>
            </div>

            <ul className="max-h-56 overflow-y-auto p-1 divide-y divide-neutral-50">
              {roles.map((role) => {
                const isActive = role.role_id === selectedRoleId;
                const name = role.role_master?.role_name ?? `Role ${role.role_id}`;
                const short = role.role_master?.short_name;

                return (
                  <li key={role.user_role_mapping_id}>
                    <button
                      type="button"
                      onClick={() => {
                        onRoleChange?.(role);
                        setRoleMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${
                        isActive
                          ? "bg-red-50 text-[#C81E1E]"
                          : "hover:bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isActive
                            ? "bg-[#C81E1E] text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-xs font-bold ${
                            isActive ? "text-[#C81E1E]" : "text-neutral-800"
                          }`}
                        >
                          {name}
                        </p>

                        {short && (
                          <p className="truncate text-[10px] text-neutral-400">
                            {short}
                          </p>
                        )}
                      </div>

                      {isActive && (
                        <span className="shrink-0 text-[#C81E1E]">
                          <CheckIcon size={14} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* User Card */}
        <button
          type="button"
          onClick={() => !collapsed && setRoleMenuOpen((o) => !o)}
          title={collapsed ? username ?? "User" : undefined}
          className={`flex w-full items-center gap-2.5 rounded-xl p-1.5 transition ${
            !collapsed ? "cursor-pointer hover:bg-neutral-100" : "cursor-default justify-center"
          } ${roleMenuOpen ? "bg-neutral-100" : ""}`}
        >
          {/* Avatar with theme color ring */}
          <Avatar
            name={username || "User"}
            size="sm"
            withRing
            ringColor="theme"
            status="online"
          />

          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-bold text-neutral-900 leading-tight">
                {username || "User"}
              </p>
              <p className="truncate text-[10px] font-semibold text-[#C81E1E] mt-0.5">
                {currentRoleName || ntId || "Administrator"}
              </p>
            </div>
          )}

          {!collapsed && roles.length > 0 && (
            <span
              className={`shrink-0 text-neutral-400 transition-transform ${
                roleMenuOpen ? "rotate-180" : ""
              }`}
            >
              <ChevronDownIcon size={14} />
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          title={collapsed ? "Logout" : undefined}
          className={`mt-1.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50/80 transition disabled:opacity-50 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="shrink-0">
            <LogOutIcon size={15} />
          </span>

          {!collapsed && <span>{loggingOut ? "Signing out…" : "Log Out"}</span>}
        </button>
      </div>
    </aside>
  );
}