"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from '../app/store/store';


// Static bottom links
const STATIC_LINKS = [
  { key: "settings", label: "Settings", icon: "⚙" },
  { key: "profile", label: "Profile", icon: "◎" },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface RoleOption {
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

interface SidebarProps {
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
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  
  const menus =  useSelector((state: RootState) => state.menu.menus)

  const MENU_CONFIG = useMemo(()=>{
    return Object.fromEntries(
      menus.map((key: string) => [
        key,
        {
          label: key.replace(/([A-Z])/g, " $1").replace(/^./, (char: string) => char.toUpperCase()),
          icon: "○",
        }
      ])
    );
  },  [menus])

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

  // Backend menus decide what appears in the sidebar
  const navItems = menus.map((key) => ({
    key,
    label:
      MENU_CONFIG[key]?.label ??
      key.replace(/_/g, " "),

    icon:
      MENU_CONFIG[key]?.icon ??
      "○",
  }));

  const initials = username
    ? username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      } sticky top-0 shrink-0`}
    >
      {/* Logo / brand */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
        {!collapsed && (
          <span className="truncate text-sm font-bold tracking-wide text-violet-600">
            MyApp
          </span>
        )}

        <button
          onClick={() => {
            setCollapsed((c) => !c);
            setRoleMenuOpen(false);
          }}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.key === activeKey;

            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavClick?.(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-violet-50 text-violet-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base ${
                      isActive
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="truncate capitalize">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-4 border-t border-slate-100" />

        {/* Static links */}
        <ul className="space-y-1">
          {STATIC_LINKS.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onNavClick?.(item.key)}
                title={collapsed ? item.label : undefined}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base text-slate-400">
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="truncate capitalize">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User card + role switcher */}
      <div
        className="border-t border-slate-100 px-3 py-4"
        ref={roleMenuRef}
      >
        {/* Role popover */}
        {roleMenuOpen && !collapsed && roles.length > 0 && (
          <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Switch Role
            </p>

            <ul>
              {roles.map((role) => {
                const isActive =
                  role.role_id === selectedRoleId;

                const name =
                  role.role_master?.role_name ??
                  `Role ${role.role_id}`;

                const short =
                  role.role_master?.short_name;

                return (
                  <li key={role.user_role_mapping_id}>
                    <button
                      onClick={() => {
                        onRoleChange?.(role);
                        setRoleMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        isActive ? "bg-violet-50" : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                          isActive
                            ? "bg-violet-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-semibold ${
                            isActive
                              ? "text-violet-700"
                              : "text-slate-800"
                          }`}
                        >
                          {name}
                        </p>

                        {short && (
                          <p className="truncate text-xs text-slate-400">
                            {short}
                          </p>
                        )}
                      </div>

                      {isActive && (
                        <span className="shrink-0 text-sm text-violet-600">
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* User card */}
        <button
          onClick={() =>
            !collapsed &&
            setRoleMenuOpen((o) => !o)
          }
          title={
            collapsed
              ? username ?? "User"
              : undefined
          }
          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 transition ${
            !collapsed
              ? "cursor-pointer hover:bg-slate-100"
              : "cursor-default"
          } ${
            roleMenuOpen
              ? "bg-slate-100"
              : ""
          }`}
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
            {initials}

            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-slate-800">
                {username || "User"}
              </p>

              <p className="truncate text-xs text-slate-400">
                {currentRoleName || ntId || ""}
              </p>
            </div>
          )}

          {!collapsed && roles.length > 0 && (
            <span
              className={`shrink-0 text-xs text-slate-400 transition-transform ${
                roleMenuOpen
                  ? "rotate-180"
                  : ""
              }`}
            >
              ▲
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          disabled={loggingOut}
          title={collapsed ? "Logout" : undefined}
          className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="shrink-0 text-base">
            ⏻
          </span>

          {!collapsed && (
            <span>Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
}