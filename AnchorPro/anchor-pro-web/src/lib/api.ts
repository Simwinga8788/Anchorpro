// Always use relative paths — Next.js rewrites proxy /api/* to backend
const API_BASE = '';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
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

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`DELETE error ${res.status} on ${path}`);
}

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Auth API ── /api/auth ──────────────────────────────────────────────────────
export const authApi = {
  getMe:           ()           => apiFetch<any>('/api/auth/me'),
  login:           (data: any)  => apiPost<any>('/api/auth/login', data),
  logout:          ()           => apiPost<any>('/api/auth/logout', {}),
  forgotPassword:  (data: any)  => apiPost<any>('/api/auth/forgot-password', data),
  resetPassword:   (data: any)  => apiPost<any>('/api/auth/reset-password', data),
};

// ─── Users API ── /api/users ────────────────────────────────────────────────────
export const usersApi = {
  getAll:          ()                   => apiFetch<any[]>('/api/users'),
  getById:         (id: string)         => apiFetch<any>(`/api/users/${id}`),
  getMe:           ()                   => apiFetch<any>('/api/users/me'),
  create:          (data: any)          => apiPost<any>('/api/users', data),
  update:          (id: string, data: any) => apiPut<any>(`/api/users/${id}`, data),
  delete:          (id: string)         => apiDelete(`/api/users/${id}`),
  changePassword:  (id: string, data: any) => apiPost<any>(`/api/users/${id}/change-password`, data),
  deactivate:      (id: string)         => apiPatch<any>(`/api/users/${id}/deactivate`, {}),
  activate:        (id: string)         => apiPatch<any>(`/api/users/${id}/activate`, {}),
};

// ─── Dashboard API ── /api/dashboard (includes legacy aliases for existing pages) ─
export const dashboardApi = {
  // Real dashboard endpoints
  getStats:                    ()                    => apiFetch<DashboardStats>('/api/dashboard/stats'),
  getPerformance:              (days = 30)            => apiFetch<PerformanceMetrics>(`/api/dashboard/performance?days=${days}`),
  getHealth:                   ()                    => apiFetch<SystemHealth>('/api/dashboard/health'),
  getExecutive:                ()                    => apiFetch<ExecutiveSnapshot>('/api/dashboard/executive'),
  getDepartments:              ()                    => apiFetch<DepartmentalSnapshot[]>('/api/dashboard/departments'),
  getEquipmentPerformance:     (id: number, days = 30) => apiFetch<any>(`/api/dashboard/equipment/${id}?days=${days}`),
  // Legacy aliases — delegate to real APIs
  getJobCards:                 ()                    => jobCardsApi.getAll(),
  createJobCard:               (data: any)           => jobCardsApi.create(data),
  getEquipment:                ()                    => referenceDataApi.getEquipment(),
  getJobTypes:                 ()                    => referenceDataApi.getJobTypes(),
  getCustomers:                ()                    => customersApi.getAll(),
  getContracts:                ()                    => referenceDataApi.getContracts(),
  getReferenceDataTechnicians: ()                    => referenceDataApi.getTechnicians(),
  getTechnicians:              ()                    => referenceDataApi.getTechnicians(),
  getPurchaseOrders:           ()                    => procurementApi.getOrders(),
  getSuppliers:                ()                    => procurementApi.getSuppliers(),
  getInventoryItems:           ()                    => inventoryApi.getAll(),
  getAssets:                   ()                    => equipmentApi.getAll(),
  updateJobStatus:             (id: number, status: any) => jobCardsApi.updateStatus(id, status),
  addPartToJob:                (jobCardId: number, inventoryItemId: number, quantity: number) =>
    jobCardsApi.addPart(jobCardId, { inventoryItemId, quantity }),
  updateJobTaskStatus:         (taskId: number, _isCompleted: boolean) => jobTasksApi.complete(taskId),
  getAllDowntime:               ()                    => downtimeApi.getAll(),
  reportDowntime:              (data: any)           => downtimeApi.create(data),
  resolveDowntime:             (id: number)          => downtimeApi.update(id, { resolved: true }),
  updateDowntime:              (id: number, data: any) => downtimeApi.update(id, data),
  getDowntimeCategories:       ()                    => referenceDataApi.getDowntimeCategories(),
  getJobTasks:                 (jobId: number)       => jobTasksApi.getByJob(jobId),
  createCustomer:              (data: any)           => customersApi.create(data),
  createAsset:                 (data: any)           => equipmentApi.create(data),
  createInventoryItem:         (data: any)           => inventoryApi.create(data),
  createPurchaseOrder:         (data: any)           => procurementApi.createOrder(data),
};

// ─── Job Cards API ── /api/jobcards ────────────────────────────────────────────
export const jobCardsApi = {
  getAll:           (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<any[]>(`/api/jobcards${q}`);
  },
  getById:          (id: number)          => apiFetch<any>(`/api/jobcards/${id}`),
  getHistory:       (id: number)          => apiFetch<any[]>(`/api/jobcards/${id}/history`),
  getByTechnician:  (techId: string)      => apiFetch<any[]>(`/api/jobcards/technician/${techId}`),
  create:           (data: any)           => apiPost<any>('/api/jobcards', data),
  update:           (id: number, data: any) => apiPut<any>(`/api/jobcards/${id}`, data),
  delete:           (id: number)          => apiDelete(`/api/jobcards/${id}`),
  updateStatus:     (id: number, status: any) => apiPatch<any>(`/api/jobcards/${id}/status`, status),
  assign:           (id: number, data: any)   => apiPost<any>(`/api/jobcards/${id}/assign`, data),
  checkConflicts:   (id: number, techId: string, start: string, end: string) =>
    apiFetch<any>(`/api/jobcards/${id}/conflicts?technicianId=${techId}&startDate=${start}&endDate=${end}`),
  addPart:          (id: number, data: any)   => apiPost<any>(`/api/jobcards/${id}/parts`, data),
  removePart:       (jobCardPartId: number)   => apiDelete(`/api/jobcards/parts/${jobCardPartId}`),
  addAttachment:    (id: number, data: any)   => apiPost<any>(`/api/jobcards/${id}/attachments`, data),
  removeAttachment: (attachmentId: number)    => apiDelete(`/api/jobcards/attachments/${attachmentId}`),
};

// ─── Job Tasks API ── /api/jobtasks ────────────────────────────────────────────
export const jobTasksApi = {
  getByJob:  (jobId: number)         => apiFetch<any[]>(`/api/jobtasks/job/${jobId}`),
  getById:   (id: number)            => apiFetch<any>(`/api/jobtasks/${id}`),
  create:    (data: any)             => apiPost<any>('/api/jobtasks', data),
  update:    (id: number, data: any) => apiPut<any>(`/api/jobtasks/${id}`, data),
  complete:  (id: number)            => apiPost<any>(`/api/jobtasks/${id}/complete`, {}),
  delete:    (id: number)            => apiDelete(`/api/jobtasks/${id}`),
};

// ─── Equipment API ── /api/equipment ───────────────────────────────────────────
export const equipmentApi = {
  getAll:    ()                        => apiFetch<any[]>('/api/equipment'),
  getById:   (id: number)              => apiFetch<any>(`/api/equipment/${id}`),
  getHistory:(id: number)              => apiFetch<any[]>(`/api/equipment/${id}/history`),
  create:    (data: any)               => apiPost<any>('/api/equipment', data),
  update:    (id: number, data: any)   => apiPut<any>(`/api/equipment/${id}`, data),
  delete:    (id: number)              => apiDelete(`/api/equipment/${id}`),
};

// ─── Inventory API ── /api/inventory ───────────────────────────────────────────
export const inventoryApi = {
  getAll:       ()                         => apiFetch<any[]>('/api/inventory'),
  getById:      (id: number)               => apiFetch<any>(`/api/inventory/${id}`),
  create:       (data: any)                => apiPost<any>('/api/inventory', data),
  update:       (id: number, data: any)    => apiPut<any>(`/api/inventory/${id}`, data),
  delete:       (id: number)               => apiDelete(`/api/inventory/${id}`),
  adjustStock:  (id: number, data: any)    => apiPost<any>(`/api/inventory/${id}/adjust`, data),
  reserveStock: (id: number, data: any)    => apiPost<any>(`/api/inventory/${id}/reserve`, data),
};

// ─── Customers API ── /api/customers ───────────────────────────────────────────
export const customersApi = {
  getAll:    ()                        => apiFetch<any[]>('/api/customers'),
  getById:   (id: number)              => apiFetch<any>(`/api/customers/${id}`),
  getFull:   (id: number)              => apiFetch<any>(`/api/customers/${id}/full`),
  getStats:  (id: number)              => apiFetch<any>(`/api/customers/${id}/stats`),
  create:    (data: any)               => apiPost<any>('/api/customers', data),
  update:    (id: number, data: any)   => apiPut<any>(`/api/customers/${id}`, data),
  delete:    (id: number)              => apiDelete(`/api/customers/${id}`),
};

// ─── Contracts API ── /api/contracts ───────────────────────────────────────────
export const contractsApi = {
  getAll:        ()                        => apiFetch<any[]>('/api/contracts'),
  getById:       (id: number)              => apiFetch<any>(`/api/contracts/${id}`),
  getByCustomer: (customerId: number)      => apiFetch<any[]>(`/api/contracts/customer/${customerId}`),
  getSla:        (id: number)              => apiFetch<any>(`/api/contracts/${id}/sla`),
  create:        (data: any)               => apiPost<any>('/api/contracts', data),
  update:        (id: number, data: any)   => apiPut<any>(`/api/contracts/${id}`, data),
  cancel:        (id: number)              => apiPost<any>(`/api/contracts/${id}/cancel`, {}),
};

// ─── Downtime API ── /api/downtime ─────────────────────────────────────────────
export const downtimeApi = {
  getAll:      ()                        => apiFetch<any[]>('/api/downtime'),
  getForTask:  (taskId: number)          => apiFetch<any[]>(`/api/downtime/task/${taskId}`),
  getActive:   (userId: string)          => apiFetch<any>(`/api/downtime/active?userId=${userId}`),
  create:      (data: any)               => apiPost<any>('/api/downtime', data),
  update:      (id: number, data: any)   => apiPut<any>(`/api/downtime/${id}`, data),
  delete:      (id: number)              => apiDelete(`/api/downtime/${id}`),
};

// ─── Financial API ── /api/financial ───────────────────────────────────────────
export const financialApi = {
  getSnapshot:        ()                       => apiFetch<any>('/api/financial/snapshot'),
  getAgingReport:     ()                       => apiFetch<any>('/api/financial/aging-report'),
  getInvoices:        ()                       => apiFetch<any[]>('/api/financial/invoices'),
  getOverdueInvoices: ()                       => apiFetch<any[]>('/api/financial/invoices/overdue'),
  getInvoice:         (id: number)             => apiFetch<any>(`/api/financial/invoices/${id}`),
  getInvoiceByJob:    (jobId: number)          => apiFetch<any>(`/api/financial/invoices/job/${jobId}`),
  createFromJob:      (jobId: number)          => apiPost<any>(`/api/financial/invoices/from-job/${jobId}`, {}),
  createAdHoc:        (data: any)              => apiPost<any>('/api/financial/invoices', data),
  createFromContract: (contractId: number)     => apiPost<any>(`/api/financial/invoices/from-contract/${contractId}`, {}),
  cancelInvoice:      (id: number)             => apiPatch<any>(`/api/financial/invoices/${id}/cancel`, {}),
  updateInvoice:      (id: number, data: any)  => apiPut<any>(`/api/financial/invoices/${id}`, data),
  getPayments:        (invoiceId: number)      => apiFetch<any[]>(`/api/financial/invoices/${invoiceId}/payments`),
  recordPayment:      (data: any)              => apiPost<any>('/api/financial/payments', data),
};

// ─── Procurement API ── /api/procurement ───────────────────────────────────────
export const procurementApi = {
  getOrders:       ()                        => apiFetch<any[]>('/api/procurement/orders'),
  getOrderById:    (id: number)              => apiFetch<any>(`/api/procurement/orders/${id}`),
  getOrdersByJob:  (jobCardId: number)       => apiFetch<any[]>(`/api/procurement/orders/job/${jobCardId}`),
  createOrder:     (data: any)               => apiPost<any>('/api/procurement/orders', data),
  updateOrderStatus:(id: number, status: any)=> apiPatch<any>(`/api/procurement/orders/${id}/status`, status),
  receiveItems:    (id: number, items: any[])=> apiPost<any>(`/api/procurement/orders/${id}/receive`, items),
  getSuppliers:    ()                        => apiFetch<any[]>('/api/procurement/suppliers'),
  getSupplierById: (id: number)              => apiFetch<any>(`/api/procurement/suppliers/${id}`),
  createSupplier:  (data: any)               => apiPost<any>('/api/procurement/suppliers', data),
  updateSupplier:  (id: number, data: any)   => apiPut<any>(`/api/procurement/suppliers/${id}`, data),
  deleteSupplier:  (id: number)              => apiDelete(`/api/procurement/suppliers/${id}`),
};

// ─── Safety API ── /api/safety ─────────────────────────────────────────────────
export const safetyApi = {
  getStats:         ()                          => apiFetch<any>('/api/safety/stats'),
  getPermits:       ()                          => apiFetch<any[]>('/api/safety/permits'),
  getPermit:        (id: number)                => apiFetch<any>(`/api/safety/permits/${id}`),
  getPermitByJob:   (jobId: number)             => apiFetch<any>(`/api/safety/permits/job/${jobId}`),
  createPermit:     (data: any)                 => apiPost<any>('/api/safety/permits', data),
  updatePermitStatus:(id: number, data: any)    => apiPatch<any>(`/api/safety/permits/${id}/status`, data),
};

// ─── Intelligence API ── /api/intelligence ─────────────────────────────────────
export const intelligenceApi = {
  getSummary:               ()            => apiFetch<any>('/api/intelligence/summary'),
  getProfitability:         (days = 30)   => apiFetch<any[]>(`/api/intelligence/profitability?days=${days}`),
  getTechnicianUtilization: (days = 30)   => apiFetch<any[]>(`/api/intelligence/technician-utilization?days=${days}`),
  getRevenueByCustomer:     (days = 30)   => apiFetch<any[]>(`/api/intelligence/revenue-by-customer?days=${days}`),
  getAssetPerformance:      (days = 30)   => apiFetch<any[]>(`/api/intelligence/asset-performance?days=${days}`),
  getInventoryConsumption:  (days = 30)   => apiFetch<any[]>(`/api/intelligence/inventory-consumption?days=${days}`),
  getSubcontractorDependency:(days = 30)  => apiFetch<any[]>(`/api/intelligence/subcontractor-dependency?days=${days}`),
  getBottlenecks:           (days = 30)   => apiFetch<any[]>(`/api/intelligence/bottlenecks?days=${days}`),
};

// ─── Reporting API ── /api/reporting ───────────────────────────────────────────
export const reportingApi = {
  getSchedules:    ()                  => apiFetch<any[]>('/api/reporting/schedules'),
  createSchedule:  (data: any)         => apiPost<any>('/api/reporting/schedules', data),
  deleteSchedule:  (id: number)        => apiDelete(`/api/reporting/schedules/${id}`),
  runNow:          (reportId: number)  => apiPost<any>(`/api/reporting/run/${reportId}`, {}),
  previewHtmlUrl:  (type: string, deptId?: number) =>
    `${API_BASE}/api/reporting/preview/html?type=${type}${deptId ? `&departmentId=${deptId}` : ''}`,
  previewExcelUrl: (type: string, deptId?: number) =>
    `${API_BASE}/api/reporting/preview/excel?type=${type}${deptId ? `&departmentId=${deptId}` : ''}`,
};

// ─── Settings API ── /api/settings ─────────────────────────────────────────────
export const settingsApi = {
  getAll:      ()                                      => apiFetch<any[]>('/api/settings'),
  getByKey:    (key: string)                           => apiFetch<any>(`/api/settings/${key}`),
  upsert:      (key: string, value: string, description?: string, group?: string) =>
    apiPut<any>(`/api/settings/${key}`, { value, description, group }),
  getGlobal:   ()                                      => apiFetch<any[]>('/api/settings/global'),
  getGlobalByKey:(key: string)                         => apiFetch<any>(`/api/settings/global/${key}`),
  upsertGlobal:(key: string, value: string)            => apiPut<any>(`/api/settings/global/${key}`, { value }),
};

// ─── Subscriptions API ── /api/subscriptions ───────────────────────────────────
export const subscriptionsApi = {
  getPlans:          ()                                  => apiFetch<any[]>('/api/subscriptions/plans'),
  getCurrent:        ()                                  => apiFetch<any>('/api/subscriptions/current'),
  upgrade:           (data: any)                         => apiPost<any>('/api/subscriptions/upgrade', data),
  checkFeature:      (featureName: string)               => apiFetch<any>(`/api/subscriptions/features/${featureName}`),
  getHealth:         (subscriptionId: number)            => apiFetch<any>(`/api/subscriptions/health/${subscriptionId}`),
  getRequiringAction:()                                  => apiFetch<any[]>('/api/subscriptions/requiring-action'),
  suspend:           (id: number, data: any)             => apiPost<any>(`/api/subscriptions/${id}/suspend`, data),
  reactivate:        (id: number, data: any)             => apiPost<any>(`/api/subscriptions/${id}/reactivate`, data),
  cancel:            (id: number, data: any)             => apiPost<any>(`/api/subscriptions/${id}/cancel`, data),
  convertTrial:      (id: number, data: any)             => apiPost<any>(`/api/subscriptions/${id}/convert-trial`, data),
};

// ─── Departments API ── /api/departments ───────────────────────────────────────
export const departmentsApi = {
  getAll:   ()                        => apiFetch<any[]>('/api/departments'),
  getById:  (id: number)              => apiFetch<any>(`/api/departments/${id}`),
  create:   (data: any)               => apiPost<any>('/api/departments', data),
  update:   (id: number, data: any)   => apiPut<any>(`/api/departments/${id}`, data),
  delete:   (id: number)              => apiDelete(`/api/departments/${id}`),
};

// ─── Reference Data API ── /api/referencedata ──────────────────────────────────
export const referenceDataApi = {
  getJobTypes:            ()           => apiFetch<any[]>('/api/referencedata/jobtypes'),
  getDowntimeCategories:  ()           => apiFetch<any[]>('/api/referencedata/downtimecategories'),
  getEquipment:           ()           => apiFetch<any[]>('/api/referencedata/equipment'),
  getCustomers:           ()           => apiFetch<any[]>('/api/referencedata/customers'),
  getContracts:           ()           => apiFetch<any[]>('/api/referencedata/contracts'),
  getTechnicians:         ()           => apiFetch<any[]>('/api/referencedata/technicians'),
  createJobType:          (data: any)  => apiPost<any>('/api/referencedata/jobtypes', data),
  createDowntimeCategory: (data: any)  => apiPost<any>('/api/referencedata/downtimecategories', data),
  deleteJobType:          (id: number) => apiDelete(`/api/referencedata/jobtypes/${id}`),
  deleteDowntimeCategory: (id: number) => apiDelete(`/api/referencedata/downtimecategories/${id}`),
};

// ─── Tenants API ── /api/tenants ───────────────────────────────────────────────
export const tenantsApi = {
  getAll:      ()                        => apiFetch<any[]>('/api/tenants'),
  getById:     (id: number)              => apiFetch<any>(`/api/tenants/${id}`),
  getUsers:    (id: number)              => apiFetch<any[]>(`/api/tenants/${id}/users`),
  create:      (data: any)               => apiPost<any>('/api/tenants', data),
  update:      (id: number, data: any)   => apiPut<any>(`/api/tenants/${id}`, data),
  deactivate:  (id: number)              => apiPatch<any>(`/api/tenants/${id}/deactivate`, {}),
  activate:    (id: number)              => apiPatch<any>(`/api/tenants/${id}/activate`, {}),
  assignPlan:  (id: number, data: any)   => apiPost<any>(`/api/tenants/${id}/assign-plan`, data),
};

// ─── Admin Access API ── /api/admin-access ─────────────────────────────────────
export const adminAccessApi = {
  impersonate:      (tenantId: number)  => apiPost<any>(`/api/admin-access/impersonate/${tenantId}`, {}),
  exitImpersonation:()                  => apiPost<any>('/api/admin-access/exit-impersonation', {}),
  getStatus:        ()                  => apiFetch<any>('/api/admin-access/impersonation-status'),
  getTenants:       ()                  => apiFetch<any[]>('/api/admin-access/tenants'),
};

// ─── Alerts API ── /api/alerts ─────────────────────────────────────────────────
export const alertsApi = {
  getAll:        (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<any[]>(`/api/alerts${q}`);
  },
  getUnreadCount:()                  => apiFetch<number>('/api/alerts/unread-count'),
  markAsRead:    (id: number)        => apiPatch<any>(`/api/alerts/${id}/read`, {}),
  dismissAll:    ()                  => apiPatch<any>('/api/alerts/dismiss-all', {}),
  create:        (data: any)         => apiPost<any>('/api/alerts', data),
};

// ─── Audit Log API ── /api/audit-log ───────────────────────────────────────────
export const auditLogApi = {
  getLogs:      (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<any>(`/api/audit-log${q}`);
  },
  getSecurityLogs: (days = 90) => apiFetch<any>(`/api/audit-log/security?days=${days}`),
};

// ─── Upload API ── /api/upload ─────────────────────────────────────────────────
export const uploadApi = {
  upload:               (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/api/upload`, { method: 'POST', credentials: 'include', body: form })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`Upload error ${r.status}`)));
  },
  uploadJobAttachment:  (jobId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/api/upload/job/${jobId}`, { method: 'POST', credentials: 'include', body: form })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`Upload error ${r.status}`)));
  },
  deleteJobAttachment:  (jobId: number, attachmentId: number) =>
    apiDelete(`/api/upload/job/${jobId}/attachments/${attachmentId}`),
};

// ─── Export API ── /api/export ─────────────────────────────────────────────────
export const exportApi = {
  jobsCsvUrl:         () => `${API_BASE}/api/export/jobs/csv`,
  performanceExcelUrl:(days = 30) => `${API_BASE}/api/export/performance/excel?days=${days}`,
};

// ─── Platform admin alias (uses real admin-access + tenants APIs) ──────────────
export const platformApi = {
  getTenants:         ()            => adminAccessApi.getTenants(),
  impersonate:        (id: number)  => adminAccessApi.impersonate(id),
  exitImpersonation:  ()            => adminAccessApi.exitImpersonation(),
  getStatus:          ()            => adminAccessApi.getStatus(),
  getHealth:          ()            => dashboardApi.getHealth(),
  suspendTenant:      (id: number)  => tenantsApi.deactivate(id),
  activateTenant:     (id: number)  => tenantsApi.activate(id),
  getPlans:           ()            => subscriptionsApi.getPlans(),
  getSettings:        ()            => settingsApi.getAll(),
  updateSetting:      (key: string, value: string) => settingsApi.upsert(key, value),
};

// ─── Team API alias (delegates to usersApi) ───────────────────────────────────
export const teamApi = {
  getAll:     ()                   => usersApi.getAll(),
  invite:     (data: any)          => usersApi.create(data),
  update:     (id: string, data: any) => usersApi.update(id, data),
  deactivate: (id: string)         => usersApi.deactivate(id),
  reactivate: (id: string)         => usersApi.activate(id),
  remove:     (id: string)         => usersApi.delete(id),
};
