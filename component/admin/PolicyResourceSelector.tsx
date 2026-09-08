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
  route?: string;
  icon?: string;
  order?: number;
  access?: string;
  page?: string;
  menuKey?: string;
  fields: HierarchyField[];
}

export interface HierarchyMenu {
  key: string;
  name: string;
  displayName?: string;
  policy?: string;
  policyName?: string;
  route: string;
  icon?: string;
  order: number;
  sections: HierarchySection[];
  // Backwards compatibility alias during rollout
  menus?: HierarchySection[];
}

export type HierarchyMode = "create" | "view" | "edit" | "add" | "compact";

export interface HierarchyCounts {
  menus: number;
  sections: number;
  fields: number;
  total: number;
}

export interface PolicyResourceSelectorProps {
  mode?: HierarchyMode;
  /** Provided menus. If omitted, will be fetched from GET /api/admin/resources */
  menus?: HierarchyMenu[];
  /** Backward compatibility aliases */
  sections?: HierarchyMenu[];
  /** Set or Array of policy names that are currently selected */
  selectedPolicies?: Set<string> | string[];
  /** Policies already assigned in the bundle (useful in 'add' mode to flag/disable them) */
  assignedPolicies?: Set<string> | string[];
  /** Triggered when selection changes */
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
  /** Bundle name to display */
  bundleName?: string;
  /** Is save action in progress */
  isSaving?: boolean;
  /** In view mode: filter to only show assigned resources */
  defaultViewOnlyAssigned?: boolean;
  /** Extra container className */
  className?: string;
  /** Hide top summary chips tray */
  hideSummaryChips?: boolean;
  /** Hide toolbar */
  hideToolbar?: boolean;
}

export function PolicyResourceSelector({
  mode = "create",
  menus: propMenus,
  sections: propSections,
  selectedPolicies: propSelected,
  assignedPolicies: propAssigned,
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
}: PolicyResourceSelectorProps) {
  // --------------------------------------------------------------------------
  // 1. Data State (Normalized Menus -> Sections -> Fields)
  // --------------------------------------------------------------------------
  const [dataMenus, setDataMenus] = useState<HierarchyMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const rawMenus = propMenus || propSections;

  const normalizeHierarchy = useCallback((raw: HierarchyMenu[]): HierarchyMenu[] => {
    return raw.map((m) => {
      const menuKey = m.key || "";
      const rawSections = m.sections || m.menus || [];
      const normalizedSections: HierarchySection[] = rawSections.map((s) => {
        const secKey = s.key || "";
        const rawFields = s.fields || [];
        const normalizedFields: HierarchyField[] = rawFields.map((f) => ({
          key: f.key,
          name: f.name || f.key,
          policy: f.policy || f.policyName || f.key,
          policyName: f.policyName || f.policy || f.key,
          access: f.access || "read",
          sectionKey: secKey,
          menuKey: menuKey,
        }));

        return {
          key: secKey,
          name: s.name || s.displayName || secKey,
          displayName: s.displayName || s.name || secKey,
          policy: s.policy || s.policyName || `sec_${secKey}`,
          policyName: s.policyName || s.policy || `sec_${secKey}`,
          route: s.route,
          icon: s.icon,
          order: s.order ?? 0,
          access: s.access || "read",
          page: s.page || menuKey,
          menuKey: menuKey,
          fields: normalizedFields,
        };
      });

      return {
        key: menuKey,
        name: m.name || m.displayName || menuKey,
        displayName: m.displayName || m.name || menuKey,
        policy: m.policy || m.policyName || menuKey,
        policyName: m.policyName || m.policy || menuKey,
        route: m.route || `/${menuKey}`,
        icon: m.icon,
        order: m.order ?? 0,
        sections: normalizedSections,
      };
    });
  }, []);

  useEffect(() => {
    if (rawMenus && rawMenus.length > 0) {
      setDataMenus(normalizeHierarchy(rawMenus));
      return;
    }

    let isMounted = true;
    const fetchResources = async () => {
      try {
        setLoading(true);
        setFetchError("");
        const res = await axios.get(`${ADMIN_API}/resources`);
        if (!isMounted) return;
        const fetched = res.data?.menus || res.data?.sections || [];
        setDataMenus(normalizeHierarchy(fetched));
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Failed to load hierarchy resources:", err);
        setFetchError("Failed to fetch resource hierarchy from server.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResources();
    return () => {
      isMounted = false;
    };
  }, [rawMenus, normalizeHierarchy]);

  // --------------------------------------------------------------------------
  // 2. Selection State & Cascading Helpers
  // --------------------------------------------------------------------------
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (!propSelected) return new Set<string>();
    return propSelected instanceof Set ? new Set(propSelected) : new Set(propSelected);
  });

  // Keep in sync with prop changes
  useEffect(() => {
    if (propSelected !== undefined) {
      setSelected(propSelected instanceof Set ? new Set(propSelected) : new Set(propSelected));
    }
  }, [propSelected]);

  const assignedSet = useMemo(() => {
    if (!propAssigned) return new Set<string>();
    return propAssigned instanceof Set ? propAssigned : new Set(propAssigned);
  }, [propAssigned]);

  // Maps for fast hierarchy lookups
  const { menuByPolicy, sectionByPolicy, fieldByPolicy, policyHierarchy } = useMemo(() => {
    const menuByPol = new Map<string, HierarchyMenu>();
    const secByPol = new Map<string, { section: HierarchySection; parentMenu: HierarchyMenu }>();
    const fldByPol = new Map<
      string,
      { field: HierarchyField; parentSection: HierarchySection; parentMenu: HierarchyMenu }
    >();
    const polHier = new Map<
      string,
      {
        type: "menu" | "section" | "field";
        menuPolicy: string;
        sectionPolicy?: string;
        childSectionPolicies: string[];
        childFieldPolicies: string[];
      }
    >();

    dataMenus.forEach((menu) => {
      const menuPol = menu.policyName || menu.policy || menu.key;
      menuByPol.set(menuPol, menu);

      const childSecPols: string[] = [];
      const childFldPols: string[] = [];

      menu.sections.forEach((sec) => {
        const secPol = sec.policyName || sec.policy || sec.key;
        secByPol.set(secPol, { section: sec, parentMenu: menu });
        childSecPols.push(secPol);

        const secChildFldPols: string[] = [];
        sec.fields.forEach((fld) => {
          const fldPol = fld.policyName || fld.policy || fld.key;
          fldByPol.set(fldPol, { field: fld, parentSection: sec, parentMenu: menu });
          childFldPols.push(fldPol);
          secChildFldPols.push(fldPol);

          polHier.set(fldPol, {
            type: "field",
            menuPolicy: menuPol,
            sectionPolicy: secPol,
            childSectionPolicies: [],
            childFieldPolicies: [],
          });
        });

        polHier.set(secPol, {
          type: "section",
          menuPolicy: menuPol,
          childSectionPolicies: [],
          childFieldPolicies: secChildFldPols,
        });
      });

      polHier.set(menuPol, {
        type: "menu",
        menuPolicy: menuPol,
        childSectionPolicies: childSecPols,
        childFieldPolicies: childFldPols,
      });
    });

    return {
      menuByPolicy: menuByPol,
      sectionByPolicy: secByPol,
      fieldByPolicy: fldByPol,
      policyHierarchy: polHier,
    };
  }, [dataMenus]);

  // --------------------------------------------------------------------------
  // 3. Selection Counts
  // --------------------------------------------------------------------------
  const counts: HierarchyCounts = useMemo(() => {
    let menusCount = 0;
    let sectionsCount = 0;
    let fieldsCount = 0;

    selected.forEach((pol) => {
      const info = policyHierarchy.get(pol);
      if (info) {
        if (info.type === "menu") menusCount++;
        else if (info.type === "section") sectionsCount++;
        else if (info.type === "field") fieldsCount++;
      }
    });

    return {
      menus: menusCount,
      sections: sectionsCount,
      fields: fieldsCount,
      total: selected.size,
    };
  }, [selected, policyHierarchy]);

  // Notify parent of count updates
  useEffect(() => {
    onCountsChange?.(counts);
  }, [counts, onCountsChange]);

  const updateSelection = useCallback(
    (newSet: Set<string>) => {
      setSelected(newSet);
      onChange?.(newSet, counts);
    },
    [onChange, counts]
  );

  // --------------------------------------------------------------------------
  // 4. Cascading Toggle Actions
  // --------------------------------------------------------------------------
  const toggleMenu = useCallback(
    (menu: HierarchyMenu, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (mode === "view") return;

      const menuPol = menu.policyName || menu.policy || menu.key;
      const next = new Set(selected);
      const isCurrentlySelected = next.has(menuPol);

      if (isCurrentlySelected) {
        // Deselect Menu -> Deselect and remove all child sections and fields!
        next.delete(menuPol);
        const info = policyHierarchy.get(menuPol);
        if (info) {
          info.childSectionPolicies.forEach((sp) => next.delete(sp));
          info.childFieldPolicies.forEach((fp) => next.delete(fp));
        }
      } else {
        // Select Menu
        next.add(menuPol);
      }

      updateSelection(next);
    },
    [mode, selected, policyHierarchy, updateSelection]
  );

  const toggleMenuWithAllChildren = useCallback(
    (menu: HierarchyMenu, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (mode === "view") return;

      const menuPol = menu.policyName || menu.policy || menu.key;
      const info = policyHierarchy.get(menuPol);
      const next = new Set(selected);

      // If menu and all its sections and fields are already selected -> deselect all
      const allPols = [
        menuPol,
        ...(info?.childSectionPolicies || []),
        ...(info?.childFieldPolicies || []),
      ];
      const allSelected = allPols.every((p) => next.has(p));

      if (allSelected) {
        allPols.forEach((p) => next.delete(p));
      } else {
        allPols.forEach((p) => next.add(p));
      }

      updateSelection(next);
    },
    [mode, selected, policyHierarchy, updateSelection]
  );

  const toggleSection = useCallback(
    (section: HierarchySection, parentMenu: HierarchyMenu, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (mode === "view") return;

      const secPol = section.policyName || section.policy || section.key;
      const menuPol = parentMenu.policyName || parentMenu.policy || parentMenu.key;
      const next = new Set(selected);
      const isCurrentlySelected = next.has(secPol);

      if (isCurrentlySelected) {
        // Deselect Section -> Remove section and all its child fields!
        next.delete(secPol);
        const info = policyHierarchy.get(secPol);
        if (info) {
          info.childFieldPolicies.forEach((fp) => next.delete(fp));
        }
      } else {
        // Select Section -> Auto-select parent Menu!
        next.add(secPol);
        next.add(menuPol);
      }

      updateSelection(next);
    },
    [mode, selected, policyHierarchy, updateSelection]
  );

  const toggleSectionWithAllFields = useCallback(
    (section: HierarchySection, parentMenu: HierarchyMenu, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (mode === "view") return;

      const secPol = section.policyName || section.policy || section.key;
      const menuPol = parentMenu.policyName || parentMenu.policy || parentMenu.key;
      const info = policyHierarchy.get(secPol);
      const next = new Set(selected);

      const allPols = [secPol, ...(info?.childFieldPolicies || [])];
      const allSelected = allPols.every((p) => next.has(p));

      if (allSelected) {
        allPols.forEach((p) => next.delete(p));
      } else {
        next.add(menuPol); // auto-select parent menu
        allPols.forEach((p) => next.add(p));
      }

      updateSelection(next);
    },
    [mode, selected, policyHierarchy, updateSelection]
  );

  const toggleField = useCallback(
    (
      field: HierarchyField,
      parentSection: HierarchySection,
      parentMenu: HierarchyMenu,
      e?: React.MouseEvent
    ) => {
      e?.stopPropagation();
      if (mode === "view") return;

      const fldPol = field.policyName || field.policy || field.key;
      const secPol = parentSection.policyName || parentSection.policy || parentSection.key;
      const menuPol = parentMenu.policyName || parentMenu.policy || parentMenu.key;

      const next = new Set(selected);
      if (next.has(fldPol)) {
        next.delete(fldPol);
      } else {
        // Select Field -> Auto-select parent Section and parent Menu!
        next.add(fldPol);
        next.add(secPol);
        next.add(menuPol);
      }

      updateSelection(next);
    },
    [mode, selected, updateSelection]
  );

  const handleSelectAllGlobal = useCallback(() => {
    if (mode === "view") return;
    const all = new Set<string>();
    dataMenus.forEach((m) => {
      all.add(m.policyName || m.policy || m.key);
      m.sections.forEach((s) => {
        all.add(s.policyName || s.policy || s.key);
        s.fields.forEach((f) => {
          all.add(f.policyName || f.policy || f.key);
        });
      });
    });
    updateSelection(all);
  }, [mode, dataMenus, updateSelection]);

  const handleClearAllGlobal = useCallback(() => {
    if (mode === "view") return;
    updateSelection(new Set());
  }, [mode, updateSelection]);

  // --------------------------------------------------------------------------
  // 5. Active Focus & Drilldown Navigation
  // --------------------------------------------------------------------------
  const [activeMenuKey, setActiveMenuKey] = useState<string>("");
  const [activeSectionKey, setActiveSectionKey] = useState<string>("");

  // Set default active menu once data is available
  useEffect(() => {
    if (!activeMenuKey && dataMenus.length > 0) {
      // Pick first menu with selected policies, or simply the first menu
      const firstWithSel = dataMenus.find((m) => {
        const mPol = m.policyName || m.policy || m.key;
        return selected.has(mPol);
      });
      const chosen = firstWithSel || dataMenus[0];
      setActiveMenuKey(chosen.key);
      if (chosen.sections.length > 0) {
        setActiveSectionKey(chosen.sections[0].key);
      }
    }
  }, [dataMenus, activeMenuKey, selected]);

  // Column search filters
  const [menuSearch, setMenuSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");

  // View mode filter: Assigned Only vs All
  const [viewOnlyAssigned, setViewOnlyAssigned] = useState(defaultViewOnlyAssigned);

  // Column 2 Scope Toggle: "Focused Menu" vs "All Selected Menus"
  const [sectionScope, setSectionScope] = useState<"focused" | "all_selected">("focused");

  // Column 3 Scope Toggle: "Focused Section" vs "All Selected Sections"
  const [fieldScope, setFieldScope] = useState<"focused" | "all_selected">("focused");

  // Active objects
  const activeMenu = useMemo(
    () => dataMenus.find((m) => m.key === activeMenuKey) || null,
    [dataMenus, activeMenuKey]
  );

  const activeSection = useMemo(() => {
    if (!activeMenu) return null;
    return activeMenu.sections.find((s) => s.key === activeSectionKey) || null;
  }, [activeMenu, activeSectionKey]);

  // Click on menu row -> focus it and auto-pick its first section
  const handleFocusMenu = (menu: HierarchyMenu) => {
    setActiveMenuKey(menu.key);
    if (menu.sections.length > 0) {
      setActiveSectionKey(menu.sections[0].key);
    } else {
      setActiveSectionKey("");
    }
  };

  // Click on section row -> focus it
  const handleFocusSection = (section: HierarchySection, parentMenu: HierarchyMenu) => {
    setActiveMenuKey(parentMenu.key);
    setActiveSectionKey(section.key);
  };

  // --------------------------------------------------------------------------
  // 6. Filtered Lists for the Three Columns
  // --------------------------------------------------------------------------
  // Column 1: Menus
  const filteredMenus = useMemo(() => {
    return dataMenus.filter((m) => {
      const menuPol = m.policyName || m.policy || m.key;
      if (mode === "view" && viewOnlyAssigned) {
        // In view mode with assigned only: show if menu itself or any child is in selected
        const info = policyHierarchy.get(menuPol);
        const hasAssigned =
          selected.has(menuPol) ||
          (info?.childSectionPolicies.some((sp) => selected.has(sp)) ?? false) ||
          (info?.childFieldPolicies.some((fp) => selected.has(fp)) ?? false);
        if (!hasAssigned) return false;
      }

      if (!menuSearch.trim()) return true;
      const q = menuSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.key.toLowerCase().includes(q) ||
        (m.policyName && m.policyName.toLowerCase().includes(q))
      );
    });
  }, [dataMenus, mode, viewOnlyAssigned, selected, policyHierarchy, menuSearch]);

  // Column 2: Sections
  const displayedSections = useMemo(() => {
    let sectionsList: { section: HierarchySection; parentMenu: HierarchyMenu }[] = [];

    if (sectionScope === "focused" && activeMenu) {
      sectionsList = activeMenu.sections.map((s) => ({ section: s, parentMenu: activeMenu }));
    } else {
      // All selected menus (or all menus if none selected)
      const targetMenus = dataMenus.filter((m) => {
        const mPol = m.policyName || m.policy || m.key;
        return selected.has(mPol);
      });
      const menusToUse = targetMenus.length > 0 ? targetMenus : dataMenus;
      menusToUse.forEach((m) => {
        m.sections.forEach((s) => {
          sectionsList.push({ section: s, parentMenu: m });
        });
      });
    }

    return sectionsList.filter(({ section: s, parentMenu: m }) => {
      const secPol = s.policyName || s.policy || s.key;
      if (mode === "view" && viewOnlyAssigned) {
        const info = policyHierarchy.get(secPol);
        const hasAssigned =
          selected.has(secPol) ||
          (info?.childFieldPolicies.some((fp) => selected.has(fp)) ?? false);
        if (!hasAssigned) return false;
      }

      if (!sectionSearch.trim()) return true;
      const q = sectionSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q) ||
        ((s.policyName || s.policy || s.key) ?? "").toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
      );
    });
  }, [sectionScope, activeMenu, dataMenus, selected, mode, viewOnlyAssigned, policyHierarchy, sectionSearch]);

  // Column 3: Fields
  const displayedFields = useMemo(() => {
    let fieldsList: {
      field: HierarchyField;
      parentSection: HierarchySection;
      parentMenu: HierarchyMenu;
    }[] = [];

    if (fieldScope === "focused" && activeSection && activeMenu) {
      fieldsList = activeSection.fields.map((f) => ({
        field: f,
        parentSection: activeSection,
        parentMenu: activeMenu,
      }));
    } else {
      // All selected sections (or sections in current scope)
      displayedSections.forEach(({ section: s, parentMenu: m }) => {
        const sPol = s.policyName || s.policy || s.key;
        if (selected.has(sPol) || fieldScope === "focused") {
          s.fields.forEach((f) => {
            fieldsList.push({ field: f, parentSection: s, parentMenu: m });
          });
        }
      });
      // If list is still empty, populate from all displayed sections
      if (fieldsList.length === 0) {
        displayedSections.forEach(({ section: s, parentMenu: m }) => {
          s.fields.forEach((f) => {
            fieldsList.push({ field: f, parentSection: s, parentMenu: m });
          });
        });
      }
    }

    return fieldsList.filter(({ field: f, parentSection: s, parentMenu: m }) => {
      const fldPol = f.policyName || f.policy || f.key;
      if (mode === "view" && viewOnlyAssigned) {
        if (!selected.has(fldPol)) return false;
      }

      if (!fieldSearch.trim()) return true;
      const q = fieldSearch.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        ((f.policyName || f.policy || f.key) ?? "").toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
      );
    });
  }, [
    fieldScope,
    activeSection,
    activeMenu,
    displayedSections,
    selected,
    mode,
    viewOnlyAssigned,
    fieldSearch,
  ]);

  // --------------------------------------------------------------------------
  // 7. Render Loading or Error States
  // --------------------------------------------------------------------------
  if (loading && dataMenus.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#C81E1E]" />
          <span className="text-xs font-semibold">Loading resource hierarchy...</span>
        </div>
      </div>
    );
  }

  if (fetchError && dataMenus.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-xs text-red-700">
        <div className="font-bold">Error loading resources</div>
        <p className="mt-1">{fetchError}</p>
      </div>
    );
  }

  const isCompact = mode === "compact";

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* ==================================================================== */}
      {/* Top Counters Tray & Quick Action Bar                                 */}
      {/* ==================================================================== */}
      {!hideSummaryChips && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-1">Resource Breakdown:</span>
            {/* Menus chip */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-800">
              <span className="flex h-2 w-2 rounded-full bg-purple-500" />
              <span>Menus (P):</span>
              <span className="font-black">{counts.menus}</span>
            </div>

            {/* Sections chip */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              <span>Sections (P2):</span>
              <span className="font-black">{counts.sections}</span>
            </div>

            {/* Fields chip */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Fields (P3):</span>
              <span className="font-black">{counts.fields}</span>
            </div>

            {/* Total chip */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-1 text-xs font-black text-[#C81E1E]">
              <span>Total Selected:</span>
              <span>{counts.total}</span>
            </div>
          </div>

          {!hideToolbar && (
            <div className="flex items-center gap-2">
              {mode === "view" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewOnlyAssigned(!viewOnlyAssigned)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                      viewOnlyAssigned
                        ? "border-slate-300 bg-slate-100 text-slate-800 shadow-2xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {viewOnlyAssigned ? "✓ Showing Assigned Only" : "Showing All Resources"}
                  </button>
                  {onStartEdit && (
                    <button
                      type="button"
                      onClick={onStartEdit}
                      className="rounded-lg bg-[#C81E1E] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#B91C1C] transition shadow-2xs"
                    >
                      Edit Bundle Policies
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllGlobal}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllGlobal}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                  >
                    Clear All
                  </button>
                  {mode === "edit" && onSave && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => onSave(Array.from(selected))}
                      className="rounded-lg bg-[#C81E1E] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#B91C1C] disabled:opacity-50 transition"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                  {mode === "edit" && onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  )}
                  {mode === "add" && onAddSelected && (
                    <button
                      type="button"
                      disabled={isSaving || counts.total === 0}
                      onClick={() => onAddSelected(Array.from(selected))}
                      className="rounded-lg bg-[#C81E1E] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#B91C1C] disabled:opacity-50 transition"
                    >
                      {isSaving ? "Adding..." : `Add Selected (${counts.total})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3-Column Resource Navigation Panel                                   */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 shadow-xs">
        {/* ================================================================== */}
        {/* COLUMN 1: MENUS (P)                                                */}
        {/* ================================================================== */}
        <div className="md:col-span-4 flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden h-[580px]">
          {/* Header */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-600 text-[10px] font-black text-white">
                  P
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Level 1 · Menus
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {filteredMenus.length} items
              </span>
            </div>

            {/* Column Search */}
            <div className="relative">
              <input
                type="text"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search menus..."
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pl-7 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              {menuSearch && (
                <button
                  type="button"
                  onClick={() => setMenuSearch("")}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Menus List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50">
            {filteredMenus.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No menus found matching &ldquo;{menuSearch}&rdquo;
              </div>
            ) : (
              filteredMenus.map((menu) => {
                const menuPol = menu.policyName || menu.policy || menu.key;
                const isSelected = selected.has(menuPol);
                const isAssigned = assignedSet.has(menuPol);
                const isFocused = activeMenuKey === menu.key;
                const info = policyHierarchy.get(menuPol);
                const totalSections = menu.sections.length;
                const selectedSections = menu.sections.filter((s) =>
                  selected.has(s.policyName || s.policy || s.key)
                ).length;

                return (
                  <div
                    key={menu.key}
                    onClick={() => handleFocusMenu(menu)}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition select-none ${
                      isFocused
                        ? "bg-purple-50/80 border border-purple-300 ring-1 ring-purple-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {mode !== "view" && (
                        <input
                          type="checkbox"
                          checked={isSelected || isAssigned}
                          disabled={mode === "add" && isAssigned}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => toggleMenu(menu, e as unknown as React.MouseEvent)}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 transition cursor-pointer"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold truncate ${
                              isFocused ? "text-purple-950" : "text-slate-800"
                            }`}
                          >
                            {menu.name}
                          </span>
                          {isAssigned && mode === "add" && (
                            <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[9px] font-bold text-slate-700">
                              Already in Bundle
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-mono">{menu.route}</span>
                          <span>•</span>
                          <span className="font-mono text-purple-600">{menuPol}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                          selectedSections > 0
                            ? "bg-purple-100 text-purple-800 font-extrabold"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        title={`${selectedSections} of ${totalSections} sections selected`}
                      >
                        {selectedSections > 0
                          ? `${selectedSections}/${totalSections}`
                          : `${totalSections} sec`}
                      </span>
                      <span
                        className={`text-xs transition ${
                          isFocused ? "text-purple-600 font-black translate-x-0.5" : "text-slate-300"
                        }`}
                      >
                        →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick footer hint */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 text-[10px] text-slate-400">
            Click row to view sections · Checkbox selects menu policy
          </div>
        </div>

        {/* ================================================================== */}
        {/* COLUMN 2: SECTIONS (P2)                                            */}
        {/* ================================================================== */}
        <div className="md:col-span-4 flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden h-[580px]">
          {/* Header */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-[10px] font-black text-white">
                  P2
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Level 2 · Sections
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {displayedSections.length} items
              </span>
            </div>

            {/* Scope Switcher: Focused Menu vs All Selected */}
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSectionScope("focused")}
                  className={`rounded-md px-2 py-0.5 font-bold transition ${
                    sectionScope === "focused"
                      ? "bg-blue-100 text-blue-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {activeMenu ? `Menu: ${activeMenu.name}` : "Focused Menu"}
                </button>
                <button
                  type="button"
                  onClick={() => setSectionScope("all_selected")}
                  className={`rounded-md px-2 py-0.5 font-bold transition ${
                    sectionScope === "all_selected"
                      ? "bg-blue-100 text-blue-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All Selected Menus
                </button>
              </div>

              {activeMenu && mode !== "view" && (
                <button
                  type="button"
                  onClick={(e) => toggleMenuWithAllChildren(activeMenu, e)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Toggle All
                </button>
              )}
            </div>

            {/* Column Search */}
            <div className="relative">
              <input
                type="text"
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
                placeholder="Search sections..."
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pl-7 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              {sectionSearch && (
                <button
                  type="button"
                  onClick={() => setSectionSearch("")}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Sections List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50">
            {displayedSections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {!activeMenu ? (
                  "Select a menu on the left to view its sections"
                ) : (
                  <>No sections found matching &ldquo;{sectionSearch}&rdquo;</>
                )}
              </div>
            ) : (
              displayedSections.map(({ section, parentMenu }) => {
                const secPol = section.policyName || section.policy || section.key;
                const isSelected = selected.has(secPol);
                const isAssigned = assignedSet.has(secPol);
                const isFocused =
                  activeSectionKey === section.key && activeMenuKey === parentMenu.key;
                const totalFields = section.fields.length;
                const selectedFields = section.fields.filter((f) =>
                  selected.has(f.policyName || f.policy || f.key)
                ).length;
                const menuIsSelected = selected.has(
                  parentMenu.policyName || parentMenu.policy || parentMenu.key
                );

                return (
                  <div
                    key={`${parentMenu.key}_${section.key}`}
                    onClick={() => handleFocusSection(section, parentMenu)}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition select-none ${
                      isFocused
                        ? "bg-blue-50/80 border border-blue-300 ring-1 ring-blue-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {mode !== "view" && (
                        <input
                          type="checkbox"
                          checked={isSelected || isAssigned}
                          disabled={mode === "add" && isAssigned}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            toggleSection(section, parentMenu, e as unknown as React.MouseEvent)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition cursor-pointer"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold truncate ${
                              isFocused ? "text-blue-950" : "text-slate-800"
                            }`}
                          >
                            {section.name}
                          </span>
                          {sectionScope === "all_selected" && (
                            <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-semibold text-slate-500">
                              {parentMenu.name}
                            </span>
                          )}
                          {isAssigned && mode === "add" && (
                            <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[9px] font-bold text-slate-700">
                              Already in Bundle
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="rounded bg-slate-100 px-1 py-0.2 font-mono uppercase text-[9px] text-slate-600">
                            {section.access || "read"}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-blue-600">{secPol}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                          selectedFields > 0
                            ? "bg-blue-100 text-blue-800 font-extrabold"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        title={`${selectedFields} of ${totalFields} fields selected`}
                      >
                        {selectedFields > 0
                          ? `${selectedFields}/${totalFields}`
                          : `${totalFields} fld`}
                      </span>
                      <span
                        className={`text-xs transition ${
                          isFocused ? "text-blue-600 font-black translate-x-0.5" : "text-slate-300"
                        }`}
                      >
                        →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick footer hint */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 text-[10px] text-slate-400">
            Selecting section auto-selects parent Menu · Unselecting removes child fields
          </div>
        </div>

        {/* ================================================================== */}
        {/* COLUMN 3: FIELDS (P3)                                              */}
        {/* ================================================================== */}
        <div className="md:col-span-4 flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden h-[580px]">
          {/* Header */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-black text-white">
                  P3
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Level 3 · Fields
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {displayedFields.length} items
              </span>
            </div>

            {/* Scope Switcher: Focused Section vs All Sections */}
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFieldScope("focused")}
                  className={`rounded-md px-2 py-0.5 font-bold transition ${
                    fieldScope === "focused"
                      ? "bg-emerald-100 text-emerald-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {activeSection ? `Section: ${activeSection.name}` : "Focused Section"}
                </button>
                <button
                  type="button"
                  onClick={() => setFieldScope("all_selected")}
                  className={`rounded-md px-2 py-0.5 font-bold transition ${
                    fieldScope === "all_selected"
                      ? "bg-emerald-100 text-emerald-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All Sections
                </button>
              </div>

              {activeSection && activeMenu && mode !== "view" && (
                <button
                  type="button"
                  onClick={(e) => toggleSectionWithAllFields(activeSection, activeMenu, e)}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                >
                  Toggle All
                </button>
              )}
            </div>

            {/* Column Search */}
            <div className="relative">
              <input
                type="text"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                placeholder="Search fields..."
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pl-7 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              {fieldSearch && (
                <button
                  type="button"
                  onClick={() => setFieldSearch("")}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Fields List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50">
            {displayedFields.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {!activeSection ? (
                  "Select a section in the middle column to view its fields"
                ) : (
                  <>No fields found matching &ldquo;{fieldSearch}&rdquo;</>
                )}
              </div>
            ) : (
              displayedFields.map(({ field, parentSection, parentMenu }) => {
                const fldPol = field.policyName || field.policy || field.key;
                const isSelected = selected.has(fldPol);
                const isAssigned = assignedSet.has(fldPol);

                return (
                  <div
                    key={`${parentMenu.key}_${parentSection.key}_${field.key}`}
                    onClick={(e) =>
                      toggleField(field, parentSection, parentMenu, e as unknown as React.MouseEvent)
                    }
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition select-none ${
                      isSelected
                        ? "bg-emerald-50/80 border border-emerald-300 ring-1 ring-emerald-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {mode !== "view" && (
                        <input
                          type="checkbox"
                          checked={isSelected || isAssigned}
                          disabled={mode === "add" && isAssigned}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            toggleField(field, parentSection, parentMenu, e as unknown as React.MouseEvent)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition cursor-pointer"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? "text-emerald-950" : "text-slate-800"
                            }`}
                          >
                            {field.name}
                          </span>
                          {fieldScope === "all_selected" && (
                            <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-semibold text-slate-500">
                              {parentSection.name}
                            </span>
                          )}
                          {isAssigned && mode === "add" && (
                            <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[9px] font-bold text-slate-700">
                              Already in Bundle
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-mono text-emerald-600 truncate max-w-[200px]">
                            {fldPol}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pl-2">
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold transition ${
                          field.access === "edit"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {field.access || "view"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick footer hint */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 text-[10px] text-slate-400">
            Selecting field auto-selects parent Section and Menu
          </div>
        </div>
      </div>
    </div>
  );
}

export default PolicyResourceSelector;

