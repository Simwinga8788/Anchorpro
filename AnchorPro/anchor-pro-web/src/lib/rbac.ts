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
  return allowedRoutes.includes(route);
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
