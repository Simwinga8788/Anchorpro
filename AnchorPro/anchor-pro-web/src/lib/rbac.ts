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
 * Routes that are always accessible for a given operationMode, regardless of allowedRoutes in the JWT.
 * These bypass the token-cached routes check so users never lose access to their mode's core pages
 * even if sync-defaults ran after their last login.
 *
 * Key: operationMode number (matches backend OperationMode enum)
 * Value: set of routes that mode always needs
 */
const MODE_CORE_ROUTES: Record<number, Set<string>> = {
  1: new Set(['/dashboard/shift-planning', '/dashboard/shift-logs', '/dashboard/contractors']),  // Mining
  3: new Set([
    '/dashboard',
    '/dashboard/boq',
    '/dashboard/site-diary',
    '/dashboard/certificates',
    '/dashboard/variations',
    '/dashboard/shift-logs',
    '/dashboard/schedule',
    '/dashboard/projects',
    '/dashboard/reports'
  ]), // Construction Management Suite Core
};

/**
 * Check if a user with the given allowed routes can access a route.
 * PlatformOwners (isPlatformOwner = true) bypass all checks.
 * operationMode is optional — when provided, mode-specific core routes bypass the JWT allowedRoutes check.
 */
export function canAccess(
  route: string,
  allowedRoutes: string[],
  isPlatformOwner: boolean,
  operationMode?: number
): boolean {
  if (isPlatformOwner) return true; // Platform owners see everything

  // ── Mode-aware bypass: never hide the core ops routes for a user's mode ──
  if (operationMode !== undefined) {
    const coreRoutes = MODE_CORE_ROUTES[operationMode];
    if (coreRoutes) {
      // Check if the route starts with any of this mode's core routes
      for (const coreRoute of coreRoutes) {
        if (route === coreRoute || route.startsWith(coreRoute + '/')) {
          // Only bypass if user has *any* dashboard access (i.e. is logged in tenant user)
          if (allowedRoutes.some(r => r.startsWith('/dashboard'))) return true;
        }
      }
    }
  }

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

  const projectsPrefix = '/dashboard/projects/';
  if (route.startsWith(projectsPrefix)) {
    const segment = route.substring(projectsPrefix.length);
    if (/^\d+$/.test(segment)) {
      normalizedRoute = '/dashboard/projects';
    }
  }

  // Normalize shift-log detail routes
  const shiftLogsPrefix = '/dashboard/shift-logs/';
  if (route.startsWith(shiftLogsPrefix)) {
    const segment = route.substring(shiftLogsPrefix.length);
    if (/^\d+$/.test(segment) || segment.match(/^\d+\//)) {
      normalizedRoute = '/dashboard/shift-logs';
    }
  }

  // Normalize shift-planning detail routes
  const shiftPlanPrefix = '/dashboard/shift-planning/';
  if (route.startsWith(shiftPlanPrefix)) {
    normalizedRoute = '/dashboard/shift-planning';
  }

  // Allow access to base dashboard for anyone with any dashboard access
  if (normalizedRoute === '/dashboard' && allowedRoutes.some(r => r.startsWith('/dashboard'))) {
    return true;
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
