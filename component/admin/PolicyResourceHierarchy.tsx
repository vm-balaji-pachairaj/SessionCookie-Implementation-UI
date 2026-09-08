"use client";

import PolicyResourceSelector, {
 HierarchyField,
 HierarchySection,
 HierarchyMenu,
 HierarchyMode,
 HierarchyCounts,
 PolicyResourceSelectorProps,
} from "./PolicyResourceSelector";

export type {
 HierarchyField,
 HierarchySection,
 HierarchyMenu,
 HierarchyMode,
 HierarchyCounts,
 PolicyResourceSelectorProps,
};

export type PolicyResourceHierarchyProps = PolicyResourceSelectorProps;

export { PolicyResourceSelector };
export const PolicyResourceHierarchy = PolicyResourceSelector;
export default PolicyResourceSelector;
