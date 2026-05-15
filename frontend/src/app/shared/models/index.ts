// ─── Enums ───────────────────────────────────────────────────
export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED' | 'PENDING_RETURN';
export type AssetCategory = 'LAPTOP' | 'DESKTOP' | 'MONITOR' | 'MOBILE' | 'TABLET' | 'PERIPHERAL' | 'LICENSE' | 'NETWORKING' | 'SERVER' | 'OTHER';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALLOCATED' | 'CANCELLED' | 'RETURNED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Role = 'EMPLOYEE' | 'IT_ADMIN' | 'SUPER_ADMIN';
export type LifecycleStage = 'ACTIVE' | 'NEAR_EOL' | 'EOL' | 'RETIRED';
export type NotificationType = 'REQUEST_SUBMITTED' | 'REQUEST_APPROVED' | 'REQUEST_REJECTED' |
  'REQUEST_ALLOCATED' | 'ASSET_ASSIGNED' | 'ASSET_RETURNED' | 'EOL_WARNING' | 'LICENSE_EXPIRY';

// ─── Shared ───────────────────────────────────────────────────
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  employeeId: string;
  name: string;
  email: string;
  password: string;
  department?: string;
  jobTitle?: string;
  phoneNumber?: string;
  role?: Role;
}

// ─── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department?: string;
  jobTitle?: string;
  phoneNumber?: string;
  role: Role;
  enabled: boolean;
  assignedAssetCount: number;
  createdAt: string;
}

// ─── Asset ────────────────────────────────────────────────────
export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  category: AssetCategory;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  status: AssetStatus;
  lifecycleStage: LifecycleStage;
  purchaseDate?: string;
  purchaseCost?: number;
  refreshDate?: string;
  warrantyExpiry?: string;
  location?: string;
  notes?: string;
  ageInMonths: number;
  assignedToId?: string;
  assignedToName?: string;
  assignedToEmail?: string;
  assignedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetCreateRequest {
  assetTag?: string;
  name: string;
  description?: string;
  category: AssetCategory;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  refreshDate?: string;
  warrantyExpiry?: string;
  location?: string;
  notes?: string;
}

export interface AssetUpdateRequest {
  name?: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  refreshDate?: string;
  warrantyExpiry?: string;
  notes?: string;
  status?: AssetStatus;
}

// ─── Asset Requests ───────────────────────────────────────────
export interface AssetRequest {
  id: string;
  requestNumber: string;
  requestedById: string;
  requestedByName: string;
  requestedByEmail: string;
  assetId?: string;
  assetTag?: string;
  assetName?: string;
  requestedAssetType?: string;
  reason: string;
  priority: Priority;
  status: RequestStatus;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  allocatedAt?: string;
  returnDueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestCreateRequest {
  assetId?: string;
  requestedAssetType?: string;
  reason: string;
  priority?: Priority;
}

export interface ReviewRequest {
  notes?: string;
}

// ─── Dashboard ────────────────────────────────────────────────
export interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  pendingRequests: number;
  approvedRequests: number;
  assetsNearEol: number;
  refreshBudget: number;
  assetsByCategory: Record<string, number>;
  assetsByStatus: Record<string, number>;
}

// ─── Notification ─────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}
