const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5165';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
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
  getStats:        () => apiFetch<DashboardStats>('/api/dashboard/stats'),
  getPerformance:  (days = 30) => apiFetch<PerformanceMetrics>(`/api/dashboard/performance?days=${days}`),
  getHealth:       () => apiFetch<SystemHealth>('/api/dashboard/health'),
  getExecutive:    () => apiFetch<ExecutiveSnapshot>('/api/dashboard/executive'),
  getDepartments:  () => apiFetch<DepartmentalSnapshot[]>('/api/dashboard/departments'),
  
  // Job Card Operations
  getJobCards:     () => apiFetch<any[]>('/api/jobcards'),
  createJobCard:   (data: any) => apiPost('/api/jobcards', data),
  
  // Reference Data
  getEquipment:    () => apiFetch<any[]>('/api/referencedata/equipment'),
  getJobTypes:     () => apiFetch<any[]>('/api/referencedata/jobtypes'),
  getCustomers:    () => apiFetch<any[]>('/api/customers'),
  getContracts:    () => apiFetch<any[]>('/api/referencedata/contracts'),
  getTechnicians:  () => apiFetch<any[]>('/api/referencedata/technicians'),
  
  // Procurement
  getPurchaseOrders: () => apiFetch<any[]>('/api/procurement/orders'),
  getSuppliers:      () => apiFetch<any[]>('/api/procurement/suppliers'),

  // Inventory & Assets
  getInventoryItems: () => apiFetch<any[]>('/api/inventoryapi'),
  getAssets:         () => apiFetch<any[]>('/api/equipmentapi'),

  // Jobs
  updateJobStatus:     (id: number, status: number) => apiPatch<any>(`/api/jobcards/${id}/status`, status),
  
  // Downtime
  getAllDowntime:      () => apiFetch<any[]>('/api/downtime'),
  reportDowntime:      (data: any) => apiPost<any>('/api/downtime', data),
  updateDowntime:      (id: number, data: any) => apiPut<any>(`/api/downtime/${id}`, data),

  // POST Operations
  createCustomer:      (data: any) => apiPost<any>('/api/customers', data),
  createAsset:         (data: any) => apiPost<any>('/api/equipmentapi', data),
  createInventoryItem: (data: any) => apiPost<any>('/api/inventoryapi', data),
  createPurchaseOrder: (data: any) => apiPost<any>('/api/procurement/orders', data),
};

async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST error ${res.status} on ${path}`);
  return res.json() as Promise<T>;
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
  return res.json() as Promise<T>;
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
  return res.json() as Promise<T>;
}
