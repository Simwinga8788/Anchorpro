// Always use relative paths — Next.js rewrites proxy /api/* to Railway
const API_BASE = '';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status} on ${path}`);
  }
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  jobsScheduledToday: number;
  jobsInProgress: number;
  jobsCompletedToday: number;
  activeTechnicians: number;
  overdueJobs: number;
  totalJobs: number;
  completedJobs: number;
  activeBreakdownsCount: number;
  recentActivity: RecentJob[];
  jobTypeDistribution: JobTypeStat[];
}

export interface RecentJob {
  jobNumber: string;
  description: string;
  status: string;
  priority: string;
  totalCost: number;
  equipment?: { name: string };
  jobType?: { name: string };
  assignedTechnician?: { userName: string; firstName?: string; lastName?: string };
}

export interface JobTypeStat {
  jobTypeName: string;
  count: number;
}

export interface PerformanceMetrics {
  completedJobsInPeriod: number;
  activeJobsCount: number;
  overdueJobsCount: number;
  avgLeadTimeHours: number;
  onTimeCompletionPercentage: number;
  technicianStats: TechnicianStat[];
  equipmentStats: EquipmentStat[];
  completionTrend: DailyJobTrend[];
  globalDowntime: DowntimeBreakdown[];
}

export interface TechnicianStat {
  technicianName: string;
  jobsCompleted: number;
  totalHoursWorked: number;
  avgJobTimeHours: number;
  utilizationPercentage: number;
}

export interface EquipmentStat {
  equipmentName: string;
  maintenanceJobsCount: number;
  totalMaintenanceHours: number;
  breakdownCount: number;
  mttr_Hours: number;
  mtbf_Hours: number;
  utilizationPercentage: number;
  predictedNextFailure?: string;
}

export interface DailyJobTrend {
  date: string;
  completedCount: number;
}

export interface DowntimeBreakdown {
  category: string;
  occurrenceCount: number;
  totalDurationHours: number;
}

export interface SystemHealth {
  databaseConnection: boolean;
  memoryUsageMB: number;
  uptime: string;
  osVersion: string;
  processorCount: number;
  serverTime: string;
  entityCounts: Record<string, number>;
}

export interface ExecutiveSnapshot {
  revenueMTD: number;
  outstandingInvoices: number;
  grossMarginPercent: number;
  averageMTTR: number;
  highestDowntimeAsset: string;
  technicianUtilization: number;
  activeJobs: number;
  safetyIncidents: number;

  // Real Cost Trinity Breakdown
  laborCostTotal: number;
  partsCostTotal: number;
  directPurchaseCostTotal: number;
  subcontractingCostTotal: number;
}

export interface DepartmentalSnapshot {
  departmentName: string;
  jobCount: number;
  totalCost: number;
  safetyFlags: number;
  averageResolutionTime: number;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  // Documented endpoints per SYSTEM_DOCUMENTATION.md
  getStats: () => apiFetch<DashboardStats>('/api/dashboard/stats'),
  getActivity: () => apiFetch<any[]>('/api/dashboard/activity'),
  getTechnicians: () => apiFetch<any[]>('/api/dashboard/technicians'),

  // These may exist as extensions — kept for pages that call them, will gracefully 404
  getPerformance: (days = 30) => apiFetch<PerformanceMetrics>(`/api/dashboard/performance?days=${days}`),
  getHealth: () => apiFetch<SystemHealth>('/api/dashboard/health'),
  getExecutive: () => apiFetch<ExecutiveSnapshot>('/api/dashboard/executive'),
  getDepartments: () => apiFetch<DepartmentalSnapshot[]>('/api/dashboard/departments'),

  // Job Card Operations
  getJobCards: () => apiFetch<any[]>('/api/jobcards'),
  createJobCard: (data: any) => apiPost('/api/jobcards', data),

  // Reference Data
  getEquipment: () => apiFetch<any[]>('/api/referencedata/equipment'),
  getJobTypes: () => apiFetch<any[]>('/api/referencedata/jobtypes'),
  getCustomers: () => apiFetch<any[]>('/api/customers'),
  getContracts: () => apiFetch<any[]>('/api/referencedata/contracts'),
  getReferenceDataTechnicians: () => apiFetch<any[]>('/api/referencedata/technicians'),

  // Procurement
  getPurchaseOrders: () => apiFetch<any[]>('/api/procurement/orders'),
  getSuppliers: () => apiFetch<any[]>('/api/procurement/suppliers'),

  // Inventory & Assets — correct paths per docs
  // Note: controller class is InventoryApiController → route is /api/inventoryapi
  getInventoryItems: () => apiFetch<any[]>('/api/inventoryapi'),
  getAssets: () => apiFetch<any[]>('/api/equipment'),

  // Jobs
  updateJobStatus: (id: number, status: number) => apiPatch<any>(`/api/jobcards/${id}/status`, status),

  // Downtime
  getAllDowntime: () => apiFetch<any[]>('/api/downtime'),
  reportDowntime: (data: any) => apiPost<any>('/api/downtime', data),
  resolveDowntime: (id: number) => apiPut<any>(`/api/downtime/${id}/resolve`, {}),
  updateDowntime: (id: number, data: any) => apiPut<any>(`/api/downtime/${id}`, data),
  getDowntimeCategories: () => apiFetch<any[]>('/api/referencedata/downtimecategories'),
  getJobTasks: (jobCardId: number) => apiFetch<any[]>(`/api/jobtasks?jobCardId=${jobCardId}`),

  // POST Operations
  createCustomer: (data: any) => apiPost<any>('/api/customers', data),
  createAsset: (data: any) => apiPost<any>('/api/equipment', data),
  createInventoryItem: (data: any) => apiPost<any>('/api/inventoryapi', data),
  createPurchaseOrder: (data: any) => apiPost<any>('/api/procurement/orders', data),
};

// ─── Intelligence API ───────────────────────────────────────────────────────────

export const intelligenceApi = {
  // Documented endpoints per SYSTEM_DOCUMENTATION.md
  getProfitability: (days = 30) => apiFetch<any[]>(`/api/intelligence/profitability?days=${days}`),
  getUtilization: () => apiFetch<any[]>('/api/intelligence/utilization'),
  getTrends: () => apiFetch<any[]>('/api/intelligence/trends'),
  getAlerts: () => apiFetch<any[]>('/api/intelligence/alerts'),

  // Extended endpoints — kept for existing pages, may 404 if not implemented
  getTechUtilization: (days = 30) => apiFetch<any[]>(`/api/intelligence/technicians?days=${days}`),
  getRevenueByCustomer: (days = 30) => apiFetch<any[]>(`/api/intelligence/revenue?days=${days}`),
  getAssetPerformance: (days = 30) => apiFetch<any[]>(`/api/intelligence/assets?days=${days}`),
  getInventoryConsumption: (days = 30) => apiFetch<any[]>(`/api/intelligence/inventory?days=${days}`),
  getExecutiveSummary: () => apiFetch<any>('/api/intelligence/executive'),
};

// ─── Reports API ────────────────────────────────────────────────────────────────

export const reportsApi = {
  // Actual backend endpoints (ReportsController)
  // Note: no base GET /api/reports — only sub-routes exist
  getScheduled: () => apiFetch<any[]>('/api/reports/scheduled'),
  saveScheduled: (data: any) => apiPost<any>('/api/reports/scheduled', data),
  deleteScheduled: (id: number) => apiDelete(`/api/reports/scheduled/${id}`),
  runReport: (id: number) => apiPost<any>(`/api/reports/scheduled/${id}/run`, {}),

  // Download/preview use authenticated fetch (blob pattern) or direct URL with auth cookie
  downloadExcelUrl: (type: string, deptId?: number) =>
    `${API_BASE}/api/reports/download/excel?type=${type}${deptId ? `&departmentId=${deptId}` : ''}`,
  previewHtmlUrl: (type: string, deptId?: number) =>
    `${API_BASE}/api/reports/preview/html?type=${type}${deptId ? `&departmentId=${deptId}` : ''}`,

  // Kept as aliases — pages that call these will get an empty graceful 404 response
  getAll: () => reportsApi.getScheduled(),
  exportUrl: (type: string) => reportsApi.downloadExcelUrl(type),
};

// ─── Safety API ─────────────────────────────────────────────────────────────────

export const safetyApi = {
  getPermits: () => apiFetch<any[]>('/api/safety/permits'),
  getPermit: (id: number) => apiFetch<any>(`/api/safety/permits/${id}`),
  getPermitByJob: (jobId: number) => apiFetch<any>(`/api/safety/permits/job/${jobId}`),
  createPermit: (data: any) => apiPost<any>('/api/safety/permits', data),
  updatePermitStatus: (id: number, status: number, notes?: string) =>
    apiPatch<any>(`/api/safety/permits/${id}/status`, { status, closureNotes: notes ?? '' }),
  getDashboard: () => apiFetch<any>('/api/safety/dashboard'),
};

// ─── Financial API ──────────────────────────────────────────────────────────────

export const financialApi = {
  getInvoices: () => apiFetch<any[]>('/api/financial/invoices'),
  getInvoice: (id: number) => apiFetch<any>(`/api/financial/invoices/${id}`),
  createFromJob: (jobId: number) => apiPost<any>(`/api/financial/invoices/from-job/${jobId}`, {}),
  createAdHoc: (data: any) => apiPost<any>('/api/financial/invoices', data),
  updateInvoice: (id: number, data: any) => apiPut<any>(`/api/financial/invoices/${id}`, data),
  getPayments: (invoiceId: number) => apiFetch<any[]>(`/api/financial/invoices/${invoiceId}/payments`),
  recordPayment: (invoiceId: number, data: any) => apiPost<any>(`/api/financial/invoices/${invoiceId}/payments`, data),
  getSummary: () => apiFetch<any>('/api/financial/summary'),
  getSnapshot: () => apiFetch<any>('/api/financial/summary'), // alias kept for existing pages
};

// ─── Settings & Seeder API ──────────────────────────────────────────────────────

export const settingsApi = {
  getAll: () => apiFetch<any[]>('/api/settings'),
  get: (key: string) => apiFetch<any>(`/api/settings/${key}`),
  set: (key: string, value: string, description?: string, group?: string) =>
    apiPut<any>(`/api/settings/${key}`, { value, description, group }),
  seedDemoData: () => apiPost<any>('/api/settings/seed-demo', {}),
  getGlobal: () => apiFetch<any[]>('/api/settings/global'),
  setGlobal: (key: string, value: string) => apiPut<any>(`/api/settings/global/${key}`, { value }),
};

// ─── Subscription API ──────────────────────────────────────────────────────────

export const subscriptionApi = {
  getCurrent: () => apiFetch<any>('/api/subscription/current'),
  getCurrentPlan: () => apiFetch<any>('/api/subscription/current-plan'),
  getPlans: () => apiFetch<any[]>('/api/subscription/plans'),
  upgrade: (planId: number) => apiPost<any>(`/api/subscription/upgrade/${planId}`, {}),
  getDaysRemaining: () => apiFetch<any>('/api/subscription/days-remaining'),
};

// ─── Org / Dept API ───────────────────────────────────────────────────────────

export const orgApi = {
  getDepartments: () => apiFetch<any[]>('/api/org/departments'),
  getDepartment: (id: number) => apiFetch<any>(`/api/org/departments/${id}`),
  createDepartment: (data: any) => apiPost<any>('/api/org/departments', data),
  updateDepartment: (id: number, data: any) => apiPut<any>(`/api/org/departments/${id}`, data),
  deleteDepartment: (id: number) => apiDelete(`/api/org/departments/${id}`),
};

// ─── Contracts API ────────────────────────────────────────────────────────────

export const contractsApi = {
  getAll: () => apiFetch<any[]>('/api/contracts'),
  getById: (id: number) => apiFetch<any>(`/api/contracts/${id}`),
  getByCustomer: (customerId: number) => apiFetch<any[]>(`/api/contracts/customer/${customerId}`),
  create: (data: any) => apiPost<any>('/api/contracts', data),
  update: (id: number, data: any) => apiPut<any>(`/api/contracts/${id}`, data),
  cancel: (id: number) => apiPatch<any>(`/api/contracts/${id}/cancel`, {}),
  getSla: (id: number) => apiFetch<any>(`/api/contracts/${id}/sla`),
};

// ─── Alerts API ───────────────────────────────────────────────────────────────

export const alertsApi = {
  triggerChecks: () => apiPost<any>('/api/alerts/check', {}),
};

// ─── Platform (Super Admin) API ────────────────────────────────────────────────
// Routes from AdminAccessController (/api/admin) and PlatformConfigController (/api/platformconfig)

export const platformApi = {
  // Tenants — AdminAccessController
  getTenants: () => apiFetch<any[]>('/api/admin-access/tenants'),
  suspendTenant: (id: number) => apiPost<any>(`/api/admin-access/tenants/${id}/suspend`, {}),
  getHealth: () => apiFetch<any>('/api/admin-access/health'),

  // Billing / Subscription plans — via subscriptionApi (tenant-scoped) or platformconfig
  getPlans: () => apiFetch<any[]>('/api/subscription/plans'),

  // Billing Stripe portal — BillingController
  createCheckout: (planId: number) => apiPost<any>('/api/billing/checkout', { planId }),
  createPortal: () => apiPost<any>('/api/billing/portal', {}),

  // Org profile — OrgController
  getOrg: () => apiFetch<any>('/api/org'),
  updateOrg: (data: any) => apiPut<any>('/api/org', data),

  // Settings (platform-level) — SettingsController
  getSettings: () => apiFetch<any[]>('/api/settings'),
  updateSetting: (key: string, value: string) => apiPut<any>(`/api/settings/${key}`, { value }),
};

export const teamApi = {
  getAll: () => apiFetch<any[]>('/api/team'),
  invite: (data: { email: string; firstName?: string; lastName?: string; employeeNumber?: string; hourlyRate?: number; role?: string; password?: string; departmentId?: number }) =>
    apiPost<any>('/api/team/invite', data),
  update: (id: string, data: { firstName?: string; lastName?: string; employeeNumber?: string; hourlyRate?: number; role?: string; departmentId?: number }) =>
    apiPut<any>(`/api/team/${id}`, data),
  deactivate: (id: string) => apiPost<any>(`/api/team/${id}/deactivate`, {}),
  reactivate: (id: string) => apiPost<any>(`/api/team/${id}/reactivate`, {}),
  remove: (id: string) => apiDelete(`/api/team/${id}`),
};

export const timeTrackingApi = {
  getAll: (jobCardId?: number, technicianId?: string) => {
    const params = new URLSearchParams();
    if (jobCardId) params.set('jobCardId', String(jobCardId));
    if (technicianId) params.set('technicianId', technicianId);
    return apiFetch<any[]>(`/api/timetracking?${params}`);
  },
  getMine: () => apiFetch<any[]>('/api/timetracking/my'),
  getForJob: (jobCardId: number) => apiFetch<any[]>(`/api/timetracking/job/${jobCardId}`),
  clockIn: (jobCardId: number, notes?: string) => apiPost<any>('/api/timetracking/clock-in', { jobCardId, notes }),
  clockOut: (entryId?: number, notes?: string) => apiPost<any>('/api/timetracking/clock-out', { entryId, notes }),
  deleteEntry: (id: number) => apiDelete(`/api/timetracking/${id}`),
};

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`DELETE error ${res.status} on ${path}`);
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST error ${res.status} on ${path}`);
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

async function apiPatch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH error ${res.status} on ${path}`);
  if (res.status === 204) return {} as T;
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

async function apiPut<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT error ${res.status} on ${path}`);
  if (res.status === 204) return {} as T;
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
