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
  PLANNER:          'Planner',
  SUPERVISOR:       'Supervisor',
  TECHNICIAN:       'Technician',
  PLATFORM_OWNER:   'PlatformOwner', // virtual flag, not an actual Identity role
} as const;

// The roles that can access each route. Empty array = any authenticated user.
export const ROUTE_ACCESS: Record<string, string[]> = {
  '/dashboard':                ['Admin', 'Planner', 'Supervisor'],
  '/dashboard/intelligence':   ['Admin'],
  '/dashboard/jobs':           ['Admin', 'Planner', 'Supervisor', 'Technician'],
  '/dashboard/planning':       ['Admin', 'Planner', 'Supervisor'],
  '/dashboard/time-tracking':  ['Admin', 'Planner', 'Supervisor'],
  '/dashboard/assets':         ['Admin', 'Planner', 'Supervisor'],
  '/dashboard/inventory':      ['Admin', 'Planner', 'Supervisor'],
  '/dashboard/procurement':    ['Admin'],
  '/dashboard/team':           ['Admin'],
  '/dashboard/reports':        ['Admin', 'Planner', 'Supervisor'],
  '/dashboard/safety':         ['Admin', 'Planner', 'Supervisor', 'Technician'],
  '/dashboard/contracts':      ['Admin'],
  '/dashboard/roles':          ['Admin', 'Supervisor', 'Planner'],
  '/dashboard/settings':       ['Admin'],
  '/dashboard/my-assignments': ['Admin', 'Planner', 'Supervisor', 'Technician'],
};

/**
 * Check if a user with the given roles can access a route.
 * PlatformOwners (isPlatformOwner = true) bypass all checks.
 */
export function canAccess(
  route: string,
  userRoles: string[],
  isPlatformOwner: boolean
): boolean {
  if (isPlatformOwner) return true; // Platform owners see everything
  const allowed = ROUTE_ACCESS[route];
  if (!allowed || allowed.length === 0) return true;
  return userRoles.some(r => allowed.includes(r));
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
