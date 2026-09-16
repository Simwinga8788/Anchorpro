/**
 * Role-Based Access Control (RBAC) configuration for Anchor Pro.
 * `allowedRoutes` is the per-role list configured in Roles & Permissions (see
 * Controllers/RolesController.cs): a mix of base routes (e.g. "/dashboard/finance")
 * that gate a Sidebar link/page, and granular "route:action" permission strings
 * (e.g. "/dashboard/finance:record_expense") that gate one button inside a page.
 */

export const ROLES = {
  ADMIN:            'Admin',
  HR:               'HR',
  PLANNER:          'Planner',
  SUPERVISOR:       'Supervisor',
  TECHNICIAN:       'Technician',
  PLATFORM_OWNER:   'PlatformOwner',
} as const;

export function canAccess(
  route: string,
  allowedRoutes: string[],
  isPlatformOwner: boolean,
  operationMode?: number
): boolean {
  // Platform Owners operate their own console, not tenant routes — never gated here.
  if (isPlatformOwner) return true;

  // /dashboard itself (the site overview) is always reachable once a user is signed in.
  if (route === '/dashboard') return true;

  // Section routes have nested pages (e.g. "/dashboard/jobs/42/print-invoice" under
  // "/dashboard/jobs") — being allowed into a section grants its sub-pages too. "/dashboard"
  // is deliberately excluded as a prefix here so it can't act as an allow-everything wildcard.
  return allowedRoutes.some(
    allowed => allowed !== '/dashboard' && (route === allowed || route.startsWith(allowed + '/'))
  );
}

export function hasPermission(
  permission: string,
  allowedRoutes: string[],
  isPlatformOwner: boolean
): boolean {
  if (isPlatformOwner) return true;

  return allowedRoutes.includes(permission);
}

export function getDefaultRoute(roles: string[], isPlatformOwner: boolean): string {
  // A Platform Owner has no tenant of their own — /dashboard is tenant-operational data
  // (jobs, sites, projects) that literally doesn't apply to them. Land them on the
  // platform console (tenants, subscriptions, payment proofs) instead.
  return isPlatformOwner ? '/platform' : '/dashboard';
}
