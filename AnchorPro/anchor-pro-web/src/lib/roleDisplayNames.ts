// Display-only labels for the seeded Identity system roles (Data/DbSeeder.cs).
// The underlying role name is what's stored in AspNetUserRoles and checked by
// [Authorize(Roles=...)] on the backend — never change that string, only how it's shown.
// These roles predate the construction pivot and still read as Job-Card/Mining vertical.
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  Supervisor: 'Site Supervisor',
  Planner: 'Project Planner',
  Technician: 'Site Technician',
  Purchasing: 'Procurement Officer',
  Storeman: 'Materials Storeman',
};

export function roleDisplayName(name?: string | null): string | null | undefined {
  if (!name) return name;
  return ROLE_DISPLAY_NAMES[name] || name;
}
