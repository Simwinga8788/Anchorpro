/**
 * Role-Based Access Control (RBAC) configuration for Anchor Pro.
 * DEVELOPMENT MODE: Full access granted to all features and routes.
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
  // Full unrestricted access during development
  return true;
}

export function hasPermission(
  permission: string,
  allowedRoutes: string[],
  isPlatformOwner: boolean
): boolean {
  // Full unrestricted access during development
  return true;
}

export function getDefaultRoute(roles: string[], isPlatformOwner: boolean): string {
  // A Platform Owner has no tenant of their own — /dashboard is tenant-operational data
  // (jobs, sites, projects) that literally doesn't apply to them. Land them on the
  // platform console (tenants, subscriptions, payment proofs) instead.
  return isPlatformOwner ? '/platform' : '/dashboard';
}
