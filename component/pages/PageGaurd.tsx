"use client";

interface Permission {
  permission: string;
  page: string;
}

interface PageGuardProps {
  permissions: Permission[];
  requiredPermission: string;
  children: React.ReactNode;
}

export default function PageGuard({
  permissions,
  requiredPermission,
  children,
}: PageGuardProps) {
  const hasPermission = permissions.some(
    (permission) =>
      permission.permission === requiredPermission,
  );

  if (!hasPermission) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="text-5xl">🚫</div>

          <h2 className="mt-4 text-xl font-bold text-slate-800">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}