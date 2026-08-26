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
  return '/dashboard';
}
