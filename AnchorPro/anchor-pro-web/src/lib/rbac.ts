/**
 * Role-Based Access Control (RBAC) configuration for Anchor Pro React Frontend.
 *
 * Page access matrix:
 * ┌──────────────────────┬──────────────┬───────┬──────────────────┬────────────┐
 * │ Page                 │ PlatformOwner│ Admin │ Planner/Supervisor│ Technician │
 * ├──────────────────────┼──────────────┼───────┼──────────────────┼────────────┤
 * │ Dashboard Overview   │     ✅       │  ✅   │       ✅          │    ❌      │
 * │ Intelligence         │     ✅       │  ✅   │       ❌          │    ❌      │
 * │ Job Cards            │     ✅       │  ✅   │       ✅          │    ✅      │
 * │ Planning Board       │     ✅       │  ✅   │       ✅          │    ❌      │
 * │ Asset Registry       │     ✅       │  ✅   │       ✅          │    ❌      │
 * │ Inventory & Parts    │     ✅       │  ✅   │       ✅          │    ❌      │
 * │ Procurement          │     ✅       │  ✅   │       ❌          │    ❌      │
 * │ Team Members         │     ✅       │  ✅   │       ❌          │    ❌      │
 * │ Reports              │     ✅       │  ✅   │       ✅          │    ❌      │
 * │ Safety & Compliance  │     ✅       │  ✅   │       ✅          │    ✅      │
 * └──────────────────────┴──────────────┴───────┴──────────────────┴────────────┘
 */

// Roles that exist in the system
export const ROLES = {
  ADMIN:            'Admin',
  HR:               'HR',
  PLANNER:          'Planner',
  SUPERVISOR:       'Supervisor',
  TECHNICIAN:       'Technician',
  PLATFORM_OWNER:   'PlatformOwner', // virtual flag, not an actual Identity role
} as const;

/**
 * Check if a user with the given allowed routes can access a route.
 * PlatformOwners (isPlatformOwner = true) bypass all checks.
 */
export function canAccess(
  route: string,
  allowedRoutes: string[],
  isPlatformOwner: boolean
): boolean {
  if (isPlatformOwner) return true; // Platform owners see everything
  
  // Normalize dynamic numeric sub-routes (e.g. /dashboard/jobs/15 -> /dashboard/jobs)
  let normalizedRoute = route;
  
  if (route.includes('/print-quotation') || route.includes('/print')) {
    if (allowedRoutes.includes('/dashboard/jobs') || allowedRoutes.includes('/dashboard/finance')) {
      return true;
    }
  }

  const jobsPrefix = '/dashboard/jobs/';
  if (route.startsWith(jobsPrefix)) {
    const segment = route.substring(jobsPrefix.length);
    if (/^\d+$/.test(segment)) {
      normalizedRoute = '/dashboard/jobs';
    }
  }

  const invoicesPrefix = '/dashboard/invoices/';
  if (route.startsWith(invoicesPrefix)) {
    const segment = route.substring(invoicesPrefix.length);
    if (/^\d+$/.test(segment)) {
      normalizedRoute = '/dashboard/finance';
    }
  }

  return allowedRoutes.includes(normalizedRoute);
}

/**
 * Check if a user has a specific granular permission token.
 * PlatformOwners bypass all checks.
 */
export function hasPermission(
  permission: string,
  allowedRoutes: string[],
  isPlatformOwner: boolean
): boolean {
  if (isPlatformOwner) return true;
  return (allowedRoutes || []).includes(permission);
}

/**
 * Get the default landing page for a user based on their roles.
 */
export function getDefaultRoute(roles: string[], isPlatformOwner: boolean): string {
  if (isPlatformOwner) return '/platform'; // Platform console
  if (roles.includes('Admin') || roles.includes('Planner') || roles.includes('Supervisor')) {
    return '/dashboard';
  }
  if (roles.includes('Technician')) return '/dashboard/jobs';
  return '/dashboard/jobs';
}
