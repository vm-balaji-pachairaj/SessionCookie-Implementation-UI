// hooks/usePermission.ts
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store/store";

export function usePermissions() {
  return useSelector((state: RootState) => state.permissions.permissions);
}

export function useHasPermission(
  match: Partial<{
    lob: string;
    page: string;
    module: string;
    section: string;
    access: string;
  }>
) {
  const permissions = usePermissions();

  return permissions.some((p) =>
    Object.entries(match).every(
      ([key, value]) => p[key as keyof typeof p] === value
    )
  );
}