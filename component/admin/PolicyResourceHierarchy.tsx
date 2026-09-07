"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const ADMIN_API = "http://localhost:5000/api/admin";

export interface HierarchyField {
  key: string;
  name: string;
  policy: string;
  policyName?: string;
  access: string;
  sectionKey?: string;
  menuKey?: string;
}

export interface HierarchySection {
  key: string;
  name: string;
  displayName?: string;
  policy: string;
  policyName?: string;
  access: string;
  page?: string;
  menuKey?: string;
  fields: HierarchyField[];
}

export interface HierarchyMenu {
  key: string;
  name: string;
  displayName?: string;
  policy: string;
  policyName?: string;
  route: string;
  icon?: string;
  order: number;
  sections: HierarchySection[];
  // Backwards compatibility aliases during rollout
  menus?: HierarchySection[];
  fields?: HierarchyField[];
}

export type HierarchyMode = "create" | "view" | "edit" | "add" | "compact";

export interface HierarchyCounts {
  menus: number;
  sections: number;
  fields: number;
  total: number;
}

export interface PolicyResourceHierarchyProps {
  mode: HierarchyMode;
  /** Provided menus. If omitted, will be fetched from GET /api/admin/resources */
  menus?: HierarchyMenu[];
  /** Backward compatibility alias for menus */
  sections?: HierarchyMenu[];
  /** Set or Array of policy names that are currently selected or assigned */
  selectedPolicies?: Set<string> | string[];
  /** Policies that are already assigned (useful in 'add' mode to disable or flag them) */
  assignedPolicies?: Set<string> | string[];
  /** Triggered when selection changes (create, edit, add modes) */
  onChange?: (selected: Set<string>, counts?: HierarchyCounts) => void;
  /** Triggered when counts change */
  onCountsChange?: (counts: HierarchyCounts) => void;
  /** Save action (edit mode) */
  onSave?: (selected: string[]) => Promise<void> | void;
  /** Cancel action (edit mode) */
  onCancel?: () => void;
  /** Switch to edit mode action (view mode) */
  onStartEdit?: () => void;
  /** Submit selected for add mode */
  onAddSelected?: (selected: string[]) => Promise<void> | void;
  /** Bundle name to display in headers or toolbars */
  bundleName?: string;
  /** Is save action in progress */
  isSaving?: boolean;
  /** In view mode: filter to only show assigned resources (default: true) */
  defaultViewOnlyAssigned?: boolean;
  /** Extra container className */
  className?: string;
  /** Hide top summary chips tray */
  hideSummaryChips?: boolean;
  /** Hide toolbar (expand/collapse/select all/search) */
  hideToolbar?: boolean;
}

export default function PolicyResourceHierarchy({
  mode,
  menus: propMenusIn,
  sections: propSectionsIn,
  selectedPolicies: propSelectedPolicies,
  assignedPolicies: propAssignedPolicies,
  onChange,
  onCountsChange,
  onSave,
  onCancel,
  onStartEdit,
  onAddSelected,
  bundleName,
  isSaving = false,
  defaultViewOnlyAssigned = true,
  className = "",
  hideSummaryChips = false,
  hideToolbar = false,
}: PolicyResourceHierarchyProps) {
  const propMenus = propMenusIn || propSectionsIn;

  // 1. Data state
  const [menus, setMenus] = useState<HierarchyMenu[]>(propMenus || []);
  const [loading, setLoading] = useState<boolean>(!propMenus || propMenus.length === 0);
  const [error, setError] = useState<string>("");

  // 2. Selection state
  const normalizeSet = useCallback(
    (input?: Set<string> | string[]): Set<string> => {
      if (!input) return new Set<string>();
      if (input instanceof Set) return new Set(input);
      return new Set(input);
    },
    []
  );

  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(() =>
    normalizeSet(propSelectedPolicies)
  );

  // Sync with prop when prop changes
  useEffect(() => {
    if (propSelectedPolicies !== undefined) {
      setSelectedPolicies(normalizeSet(propSelectedPolicies));
    }
  }, [propSelectedPolicies, normalizeSet]);

  const assignedSet = useMemo(() => {
    return normalizeSet(propAssignedPolicies);
  }, [propAssignedPolicies, normalizeSet]);

  // 3. Tree expansion state
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // 4. View mode filters
  const [viewOnlyAssigned, setViewOnlyAssigned] = useState<boolean>(
    mode === "view" || mode === "compact" ? defaultViewOnlyAssigned : false
  );
  const [search, setSearch] = useState<string>("");

  // Helper getters for policy identifiers
  const getMenuPolicy = useCallback(
    (m: HierarchyMenu) => m.policyName || m.policy || m.key,
    []
  );
  const getSecPolicy = useCallback(
    (s: HierarchySection) => s.policyName || s.policy || s.key,
    []
  );
  const getFieldPolicy = useCallback(
    (f: HierarchyField) => f.policyName || f.policy || f.key,
    []
  );

  // Load menus from API if not provided via props
  const fetchHierarchy = useCallback(async () => {
    if (propMenus && propMenus.length > 0) {
      const normalized = propMenus.map((m: any) => ({
        ...m,
        sections: m.sections || m.menus || [],
      }));
      setMenus(normalized);
      setExpandedMenus(new Set(normalized.map((m) => m.key)));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.get<any>(`${ADMIN_API}/resources`);
      const rawData = res.data;
      const data: HierarchyMenu[] = Array.isArray(rawData)
        ? rawData
        : rawData.menus || rawData.sections || [];
      const normalized = data.map((m: any) => ({
        ...m,
        sections: m.sections || m.menus || [],
      }));
      setMenus(normalized);
      setExpandedMenus(new Set(normalized.map((m) => m.key)));
    } catch (err) {
      console.error("Failed to load resource hierarchy:", err);
      setError("Unable to load resource hierarchy from server.");
    } finally {
      setLoading(false);
    }
  }, [propMenus]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // Update selection helper
  const updateSelection = useCallback(
    (updater: (prev: Set<string>) => Set<string>) => {
      setSelectedPolicies((prev) => {
        const next = updater(prev);
        if (onChange) {
          onChange(next);
        }
        return next;
      });
    },
    [onChange]
  );

  // ============================================================
  // Cascading Selection Handlers: Menu (P) -> Section (P2) -> Field (P3)
  // ============================================================

  // Level 1: Menu (P) Toggle
  const toggleMenu = (menu: HierarchyMenu) => {
    if (mode === "view" || mode === "compact") return;
    const menuPolicy = getMenuPolicy(menu);
    if (mode === "add" && assignedSet.has(menuPolicy)) return;
    const isSelected = selectedPolicies.has(menuPolicy);

    updateSelection((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        // Deselect menu -> remove menu, its sections, and their fields
        next.delete(menuPolicy);
        menu.sections.forEach((s) => {
          const sp = getSecPolicy(s);
          if (mode !== "add" || !assignedSet.has(sp)) next.delete(sp);
          s.fields.forEach((f) => {
            const fp = getFieldPolicy(f);
            if (mode !== "add" || !assignedSet.has(fp)) next.delete(fp);
          });
        });
      } else {
        // Select menu -> also auto-select child sections & fields
        next.add(menuPolicy);
        menu.sections.forEach((s) => {
          const sp = getSecPolicy(s);
          if (mode !== "add" || !assignedSet.has(sp)) next.add(sp);
          s.fields.forEach((f) => {
            const fp = getFieldPolicy(f);
            if (mode !== "add" || !assignedSet.has(fp)) next.add(fp);
          });
        });
      }
      return next;
    });

    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.delete(menu.key);
      } else {
        next.add(menu.key);
      }
      return next;
    });
  };

  // Level 2: Section (P2) Toggle
  const toggleSection = (menu: HierarchyMenu, sec: HierarchySection) => {
    if (mode === "view" || mode === "compact") return;
    const menuPolicy = getMenuPolicy(menu);
    const secPolicy = getSecPolicy(sec);
    if (mode === "add" && assignedSet.has(secPolicy)) return;
    const isSelected = selectedPolicies.has(secPolicy);

    updateSelection((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        // Deselect section -> remove section and its fields
        next.delete(secPolicy);
        sec.fields.forEach((f) => {
          const fp = getFieldPolicy(f);
          if (mode !== "add" || !assignedSet.has(fp)) next.delete(fp);
        });
      } else {
        // Select section -> auto-include parent Menu, and select child fields
        if (mode !== "add" || !assignedSet.has(menuPolicy)) next.add(menuPolicy);
        next.add(secPolicy);
        sec.fields.forEach((f) => {
          const fp = getFieldPolicy(f);
          if (mode !== "add" || !assignedSet.has(fp)) next.add(fp);
        });
      }
      return next;
    });

    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.delete(sec.key);
      } else {
        next.add(sec.key);
      }
      return next;
    });
  };

  // Level 3: Field (P3) Toggle
  const toggleField = (
    menu: HierarchyMenu,
    sec: HierarchySection,
    field: HierarchyField
  ) => {
    if (mode === "view" || mode === "compact") return;
    const menuPolicy = getMenuPolicy(menu);
    const secPolicy = getSecPolicy(sec);
    const fieldPolicy = getFieldPolicy(field);
    if (mode === "add" && assignedSet.has(fieldPolicy)) return;
    const isSelected = selectedPolicies.has(fieldPolicy);

    updateSelection((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        // Deselect field -> remove field
        next.delete(fieldPolicy);
      } else {
        // Select field -> auto-include parent Section AND parent Menu!
        if (mode !== "add" || !assignedSet.has(menuPolicy)) next.add(menuPolicy);
        if (mode !== "add" || !assignedSet.has(secPolicy)) next.add(secPolicy);
        next.add(fieldPolicy);
      }
      return next;
    });
  };

  // Bulk expansion handlers
  const expandAll = () => {
    setExpandedMenus(new Set(menus.map((m) => m.key)));
    const allSecs = new Set<string>();
    menus.forEach((m) => m.sections.forEach((s) => allSecs.add(s.key)));
    setExpandedSections(allSecs);
  };

  const collapseAll = () => {
    setExpandedMenus(new Set());
    setExpandedSections(new Set());
  };

  const selectAll = () => {
    if (mode === "view" || mode === "compact") return;
    const all = new Set<string>();
    menus.forEach((m) => {
      const mp = getMenuPolicy(m);
      if (mode !== "add" || !assignedSet.has(mp)) all.add(mp);
      m.sections.forEach((s) => {
        const sp = getSecPolicy(s);
        if (mode !== "add" || !assignedSet.has(sp)) all.add(sp);
        s.fields.forEach((f) => {
          const fp = getFieldPolicy(f);
          if (mode !== "add" || !assignedSet.has(fp)) all.add(fp);
        });
      });
    });
    updateSelection(() => all);
    setExpandedMenus(new Set(menus.map((m) => m.key)));
  };

  const clearAll = () => {
    if (mode === "view" || mode === "compact") return;
    updateSelection(() => new Set());
  };

  const toggleMenuExpand = (key: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSectionExpand = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Counts of total available items
  const totalMenus = menus.length;
  const totalSections = useMemo(
    () => menus.reduce((acc, m) => acc + m.sections.length, 0),
    [menus]
  );
  const totalFields = useMemo(
    () =>
      menus.reduce(
        (acc, m) =>
          acc + m.sections.reduce((sAcc, s) => sAcc + s.fields.length, 0),
        0
      ),
    [menus]
  );

  // Counts of selected items
  const selectedMenusCount = useMemo(
    () => menus.filter((m) => selectedPolicies.has(getMenuPolicy(m))).length,
    [menus, selectedPolicies, getMenuPolicy]
  );
  const selectedSectionsCount = useMemo(
    () =>
      menus.reduce(
        (acc, m) =>
          acc +
          m.sections.filter((s) => selectedPolicies.has(getSecPolicy(s))).length,
        0
      ),
    [menus, selectedPolicies, getSecPolicy]
  );
  const selectedFieldsCount = useMemo(
    () =>
      menus.reduce(
        (acc, m) =>
          acc +
          m.sections.reduce(
            (sAcc, s) =>
              sAcc +
              s.fields.filter((f) => selectedPolicies.has(getFieldPolicy(f)))
                .length,
            0
          ),
        0
      ),
    [menus, selectedPolicies, getFieldPolicy]
  );

  useEffect(() => {
    if (onCountsChange) {
      onCountsChange({
        menus: selectedMenusCount,
        sections: selectedSectionsCount,
        fields: selectedFieldsCount,
        total: selectedPolicies.size,
      });
    }
  }, [
    onCountsChange,
    selectedMenusCount,
    selectedSectionsCount,
    selectedFieldsCount,
    selectedPolicies.size,
  ]);

  // Filtered tree data based on search and viewOnlyAssigned
  const visibleMenus = useMemo(() => {
    const q = search.trim().toLowerCase();

    return menus
      .map((menu) => {
        const menuPolicy = getMenuPolicy(menu);
        const isMenuSelected = selectedPolicies.has(menuPolicy);

        // Sections filtering
        const matchingSections = menu.sections
          .map((sec) => {
            const secPolicy = getSecPolicy(sec);
            const isSecSelected = selectedPolicies.has(secPolicy);

            // Fields filtering
            const matchingFields = sec.fields.filter((f) => {
              const fieldPolicy = getFieldPolicy(f);
              const isFieldSelected = selectedPolicies.has(fieldPolicy);

              if (viewOnlyAssigned && !isFieldSelected) return false;
              if (!q) return true;
              return (
                f.name.toLowerCase().includes(q) ||
                fieldPolicy.toLowerCase().includes(q) ||
                f.access.toLowerCase().includes(q)
              );
            });

            if (viewOnlyAssigned) {
              if (!isSecSelected && matchingFields.length === 0) return null;
            }

            if (q) {
              const secMatches =
                (sec.displayName || sec.name).toLowerCase().includes(q) ||
                secPolicy.toLowerCase().includes(q);

              if (!secMatches && matchingFields.length === 0) return null;
              return {
                ...sec,
                fields: secMatches && !viewOnlyAssigned ? sec.fields : matchingFields,
              };
            }

            return { ...sec, fields: matchingFields };
          })
          .filter(Boolean) as HierarchySection[];

        if (viewOnlyAssigned) {
          if (!isMenuSelected && matchingSections.length === 0) return null;
        }

        if (q) {
          const menuMatches =
            (menu.displayName || menu.name).toLowerCase().includes(q) ||
            menuPolicy.toLowerCase().includes(q) ||
            (menu.route && menu.route.toLowerCase().includes(q));

          if (!menuMatches && matchingSections.length === 0) return null;
          return {
            ...menu,
            sections: menuMatches && !viewOnlyAssigned ? menu.sections : matchingSections,
          };
        }

        return { ...menu, sections: matchingSections };
      })
      .filter(Boolean) as HierarchyMenu[];
  }, [menus, search, viewOnlyAssigned, selectedPolicies, getMenuPolicy, getSecPolicy, getFieldPolicy]);

  // Handle Save
  const handleSave = async () => {
    if (onSave) {
      await onSave(Array.from(selectedPolicies));
    }
  };

  // Handle Add Selected
  const handleAddSelected = async () => {
    if (onAddSelected) {
      await onAddSelected(Array.from(selectedPolicies));
    }
  };

  // Compact Mode Render (for modals/drawers)
  if (mode === "compact") {
    return (
      <div className={`space-y-3 font-sans ${className}`}>
        {/* Compact Summary Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {bundleName ? `Bundle: ${bundleName}` : "Resource Permissions"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              {selectedPolicies.size} policies active
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-purple-700">
              {selectedMenusCount} Menus
            </span>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-700">
              {selectedSectionsCount} Sections
            </span>
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-800">
              {selectedFieldsCount} Fields
            </span>
          </div>
        </div>

        {/* Compact Tree Container */}
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="py-8 text-center text-xs text-slate-400">Loading resources…</p>
          ) : visibleMenus.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400 italic">
              No policies found in this bundle.
            </p>
          ) : (
            visibleMenus.map((menu) => {
              const menuPolicy = getMenuPolicy(menu);
              const isMenuSelected = selectedPolicies.has(menuPolicy);
              const isMenuExpanded = expandedMenus.has(menu.key);

              return (
                <div
                  key={menu.key}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
                >
                  {/* Menu Bar */}
                  <div
                    onClick={() => toggleMenuExpand(menu.key)}
                    className="flex cursor-pointer items-center justify-between gap-2 bg-[#F8FAFC] px-3.5 py-2 hover:bg-slate-100/80 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400 text-[10px]">
                        {isMenuExpanded ? "▼" : "▶"}
                      </span>
                      <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-700 shrink-0">
                        Menu (P)
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {menu.displayName || menu.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 truncate hidden sm:inline">
                        {menu.route}
                      </span>
                    </div>
                    {isMenuSelected && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-700 shrink-0">
                        ✓ Active
                      </span>
                    )}
                  </div>

                  {/* Child Sections */}
                  {isMenuExpanded && (
                    <div className="border-t border-slate-100 p-2.5 space-y-2 bg-white">
                      {menu.sections.map((sec) => {
                        const secPolicy = getSecPolicy(sec);
                        const isSecSelected = selectedPolicies.has(secPolicy);
                        const isSecExpanded = expandedSections.has(sec.key);

                        return (
                          <div
                            key={sec.key}
                            className="ml-3 rounded-lg border border-slate-200/80 bg-slate-50/50 overflow-hidden"
                          >
                            <div
                              onClick={() => toggleSectionExpand(sec.key)}
                              className="flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 hover:bg-slate-100/60 transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-slate-400 text-[9px]">
                                  {isSecExpanded ? "▼" : "▶"}
                                </span>
                                <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 shrink-0">
                                  Section (P2)
                                </span>
                                <span className="text-xs font-semibold text-slate-800 truncate">
                                  {sec.displayName || sec.name}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
                                  {secPolicy}
                                </span>
                              </div>
                              {isSecSelected && (
                                <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.2 text-[9px] font-bold text-blue-700 shrink-0">
                                  Included
                                </span>
                              )}
                            </div>

                            {/* Child Fields */}
                            {isSecExpanded && sec.fields.length > 0 && (
                              <div className="border-t border-slate-100 bg-white p-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {sec.fields.map((f) => {
                                    const fieldPolicy = getFieldPolicy(f);
                                    const isFldSelected = selectedPolicies.has(fieldPolicy);
                                    return (
                                      <div
                                        key={f.key}
                                        className={`flex items-center justify-between gap-1 rounded-md border px-2 py-1 text-xs ${
                                          isFldSelected
                                            ? "border-amber-200 bg-amber-50/40 text-amber-900"
                                            : "border-slate-150 bg-slate-50 text-slate-600"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-800">
                                            Field (P3)
                                          </span>
                                          <span className="font-medium truncate">{f.name}</span>
                                        </div>
                                        <span className="rounded bg-white px-1 text-[9px] font-mono uppercase text-slate-500 shrink-0">
                                          {f.access}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* ============================================================ */}
      {/* Live Summary Chips Tray                                     */}
      {/* ============================================================ */}
      {!hideSummaryChips && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
              Level 1: Menus (p)
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-purple-900">
                {selectedMenusCount}
              </span>
              <span className="text-xs text-purple-600">/ {totalMenus}</span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Level 2: Sections (p2)
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-blue-900">
                {selectedSectionsCount}
              </span>
              <span className="text-xs text-blue-600">/ {totalSections}</span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Level 3: Fields (p3)
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-amber-900">
                {selectedFieldsCount}
              </span>
              <span className="text-xs text-amber-700">/ {totalFields}</span>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#C81E1E]">
              {mode === "view" ? "Total Assigned" : "Total Selected"}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-[#C81E1E]">
                {selectedPolicies.size}
              </span>
              <span className="text-xs text-red-600">
                / {totalMenus + totalSections + totalFields}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Toolbar & Filter Bar                                        */}
      {/* ============================================================ */}
      {!hideToolbar && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by menu, section, field name, or policy code..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#C81E1E] focus:bg-white focus:ring-1 focus:ring-[#C81E1E]"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode: Filter Toggle & Edit Button */}
            {mode === "view" && (
              <>
                <button
                  type="button"
                  onClick={() => setViewOnlyAssigned(!viewOnlyAssigned)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    viewOnlyAssigned
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {viewOnlyAssigned
                    ? `Showing Assigned (${selectedPolicies.size})`
                    : "Show All Resources"}
                </button>
                {onStartEdit && (
                  <button
                    type="button"
                    onClick={onStartEdit}
                    className="flex items-center gap-1.5 rounded-lg bg-[#C81E1E] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#B91C1C] transition"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit Permissions
                  </button>
                )}
              </>
            )}

            {/* Edit Mode: Save & Cancel Buttons */}
            {mode === "edit" && (
              <>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                )}
                {onSave && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-[#C81E1E] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#B91C1C] disabled:opacity-50 transition"
                  >
                    {isSaving ? "Saving…" : `Save Changes (${selectedPolicies.size})`}
                  </button>
                )}
              </>
            )}

            {/* Add Mode: Add Selected Button */}
            {mode === "add" && onAddSelected && (
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={isSaving || selectedPolicies.size === 0}
                className="rounded-lg bg-[#C81E1E] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#B91C1C] disabled:opacity-50 transition"
              >
                {isSaving ? "Adding…" : `+ Add Selected (${selectedPolicies.size})`}
              </button>
            )}

            {/* Tree Controls: Expand/Collapse */}
            <button
              type="button"
              onClick={expandAll}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              Collapse All
            </button>

            {/* Selection Controls (create/edit/add modes) */}
            {(mode === "create" || mode === "edit" || mode === "add") && (
              <>
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={selectedPolicies.size === 0}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40 shadow-2xs transition"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ============================================================ */}
      {/* Cascading Tree List: Menu (P) -> Section (P2) -> Field (P3)  */}
      {/* ============================================================ */}
      <div className="space-y-4 pt-1">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading resource hierarchy…
          </div>
        ) : visibleMenus.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {viewOnlyAssigned
              ? "No assigned resources in this bundle. Click 'Show All Resources' or 'Edit Permissions' to configure."
              : "No resources match your search query."}
          </div>
        ) : (
          visibleMenus.map((menu) => {
            const menuPolicy = getMenuPolicy(menu);
            const isMenuAssigned = mode === "add" && assignedSet.has(menuPolicy);
            const isMenuSelected = selectedPolicies.has(menuPolicy);
            const isMenuExpanded = expandedMenus.has(menu.key);

            // Child stats
            const childSectionsCount = menu.sections.length;
            const selectedChildSections = menu.sections.filter((s) => {
              const sp = getSecPolicy(s);
              return selectedPolicies.has(sp) || (mode === "add" && assignedSet.has(sp));
            }).length;

            return (
              <div
                key={menu.key}
                className={`rounded-xl border transition-all ${
                  isMenuSelected || isMenuAssigned
                    ? "border-purple-300 bg-purple-50/10 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Level 1: Menu (P) Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#F8FAFC]/80 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    {mode === "view" ? (
                      isMenuSelected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                          ✓
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xs">
                          ○
                        </span>
                      )
                    ) : (
                      <input
                        type="checkbox"
                        checked={isMenuAssigned || isMenuSelected}
                        disabled={isMenuAssigned}
                        onChange={() => toggleMenu(menu)}
                        className="h-4 w-4 rounded border-slate-300 text-[#C81E1E] focus:ring-[#C81E1E] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => toggleMenuExpand(menu.key)}
                      className="flex items-center gap-2 text-left group"
                    >
                      <span className="text-slate-400 group-hover:text-slate-700 transition">
                        {isMenuExpanded ? "▼" : "▶"}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {menu.displayName || menu.name}
                      </span>
                    </button>

                    <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                      Menu (P)
                    </span>
                    <code className="font-mono text-[11px] text-slate-500">
                      {menuPolicy}
                    </code>
                    {menu.route && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                        {menu.route}
                      </span>
                    )}
                    {isMenuAssigned && (
                      <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        Already in Bundle
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedChildSections} of {childSectionsCount} Sections
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleMenuExpand(menu.key)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      {isMenuExpanded ? "Collapse" : "Expand"}
                    </button>
                  </div>
                </div>

                {/* Level 2: Child Sections (Visible if menu expanded) */}
                {isMenuExpanded && (
                  <div className="p-4 space-y-3 border-t border-slate-100">
                    {menu.sections.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No sections in this menu.
                      </p>
                    ) : (
                      menu.sections.map((section) => {
                        const secPolicy = getSecPolicy(section);
                        const isSecAssigned = mode === "add" && assignedSet.has(secPolicy);
                        const isSecSelected = selectedPolicies.has(secPolicy);
                        const isSecExpanded = expandedSections.has(section.key);

                        const childFieldsCount = section.fields.length;
                        const selectedChildFields = section.fields.filter((f) => {
                          const fp = getFieldPolicy(f);
                          return selectedPolicies.has(fp) || (mode === "add" && assignedSet.has(fp));
                        }).length;

                        return (
                          <div
                            key={section.key}
                            className={`ml-4 pl-4 border-l-2 rounded-lg transition-all ${
                              isSecSelected || isSecAssigned
                                ? "border-blue-400 bg-blue-50/20"
                                : "border-slate-200 bg-slate-50/50"
                            }`}
                          >
                            {/* Level 2: Section Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                              <div className="flex items-center gap-3">
                                {mode === "view" ? (
                                  isSecSelected ? (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-[10px]">
                                      ○
                                    </span>
                                  )
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isSecAssigned || isSecSelected}
                                    disabled={isSecAssigned}
                                    onChange={() => toggleSection(menu, section)}
                                    className="h-4 w-4 rounded border-slate-300 text-[#C81E1E] focus:ring-[#C81E1E] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                  />
                                )}

                                <button
                                  type="button"
                                  onClick={() => toggleSectionExpand(section.key)}
                                  className="flex items-center gap-2 text-left group"
                                >
                                  <span className="text-slate-400 group-hover:text-slate-700 text-xs">
                                    {isSecExpanded ? "▼" : "▶"}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">
                                    {section.displayName || section.name}
                                  </span>
                                </button>

                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                  Section (P2)
                                </span>
                                <code className="font-mono text-[11px] text-slate-500">
                                  {secPolicy}
                                </code>
                                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-mono uppercase text-slate-600">
                                  {section.access || "read"}
                                </span>
                                {isSecAssigned && (
                                  <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[9px] font-bold text-slate-600">
                                    Already in Bundle
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-500">
                                  {selectedChildFields} of {childFieldsCount} Fields
                                </span>
                                {childFieldsCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSectionExpand(section.key)}
                                    className="text-[11px] text-slate-600 hover:text-slate-900 underline"
                                  >
                                    {isSecExpanded ? "Hide Fields" : "Show Fields"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Level 3: Child Fields (Visible if section expanded) */}
                            {isSecExpanded && section.fields.length > 0 && (
                              <div className="p-3 pt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {section.fields.map((field) => {
                                    const fieldPolicy = getFieldPolicy(field);
                                    const isFldAssigned = mode === "add" && assignedSet.has(fieldPolicy);
                                    const isFieldSelected = selectedPolicies.has(fieldPolicy);

                                    return (
                                      <label
                                        key={field.key}
                                        className={`flex items-center gap-2.5 rounded-lg border p-2.5 transition ${
                                          mode === "view"
                                            ? isFieldSelected
                                              ? "border-amber-300 bg-amber-50/40"
                                              : "border-slate-100 bg-slate-50/40 opacity-60"
                                            : isFldAssigned
                                            ? "border-slate-200 bg-slate-50/70 opacity-70 cursor-not-allowed"
                                            : isFieldSelected
                                            ? "border-amber-300 bg-amber-50/40 shadow-2xs cursor-pointer"
                                            : "border-slate-200 bg-white hover:border-slate-300 cursor-pointer"
                                        }`}
                                      >
                                        {mode === "view" ? (
                                          isFieldSelected ? (
                                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                                              ✓
                                            </span>
                                          ) : (
                                            <span className="h-3.5 w-3.5 rounded-full border border-slate-200 bg-white" />
                                          )
                                        ) : (
                                          <input
                                            type="checkbox"
                                            checked={isFldAssigned || isFieldSelected}
                                            disabled={isFldAssigned}
                                            onChange={() =>
                                              toggleField(menu, section, field)
                                            }
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#C81E1E] focus:ring-[#C81E1E] disabled:opacity-60 disabled:cursor-not-allowed"
                                          />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="text-xs font-semibold text-slate-800 truncate">
                                              {field.name}
                                            </span>
                                            <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold uppercase text-amber-800 shrink-0">
                                              {field.access}
                                            </span>
                                          </div>
                                          <div className="font-mono text-[10px] text-slate-400 truncate">
                                            {fieldPolicy}
                                          </div>
                                        </div>
                                        {isFldAssigned && (
                                          <span className="rounded bg-slate-200/80 px-1 text-[8px] font-bold text-slate-600 shrink-0">
                                            In Bundle
                                          </span>
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
