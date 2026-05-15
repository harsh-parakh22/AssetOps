import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Asset, AssetCreateRequest, AssetUpdateRequest,
  AssetRequest, RequestCreateRequest, ReviewRequest,
  User, AuthResponse, LoginRequest, RegisterRequest,
  DashboardStats, PagedResponse, AppNotification as Notification
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private statsCache?: DashboardStats;
  private cacheTimeout = 30000; // 30 seconds
  private lastStatsFetch = 0;

  // ─── Auth ─────────────────────────────────────────────────
  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, req);
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, req);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.base}/auth/me`);
  }

  // ─── Dashboard ────────────────────────────────────────────
  getDashboardStats(): Observable<DashboardStats> {
    const now = Date.now();
    if (this.statsCache && (now - this.lastStatsFetch) <= this.cacheTimeout) {
      return of(this.statsCache);
    }

    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`).pipe(
      tap(stats => {
        this.statsCache = stats;
        this.lastStatsFetch = Date.now();
      })
    );
  }

  // ─── Assets ───────────────────────────────────────────────
  getAssets(params: {
    status?: string; category?: string; search?: string;
    page?: number; size?: number; sortBy?: string; sortDir?: string;
  }): Observable<PagedResponse<Asset>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) p = p.set(k, v); });
    return this.http.get<PagedResponse<Asset>>(`${this.base}/assets`, { params: p });
  }

  getAsset(id: string): Observable<Asset> {
    return this.http.get<Asset>(`${this.base}/assets/${id}`);
  }

  createAsset(req: AssetCreateRequest): Observable<Asset> {
    return this.http.post<Asset>(`${this.base}/assets`, req);
  }

  updateAsset(id: string, req: AssetUpdateRequest): Observable<Asset> {
    return this.http.put<Asset>(`${this.base}/assets/${id}`, req);
  }

  assignAsset(assetId: string, userId: string): Observable<Asset> {
    return this.http.post<Asset>(`${this.base}/assets/${assetId}/assign/${userId}`, {});
  }

  returnAsset(assetId: string): Observable<Asset> {
    return this.http.post<Asset>(`${this.base}/assets/${assetId}/return`, {});
  }

  getEolAssets(warningDays = 60): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${this.base}/assets/eol`, {
      params: { warningDays }
    });
  }

  // ─── Requests ─────────────────────────────────────────────
  getRequests(params: {
    status?: string; priority?: string; userId?: string;
    page?: number; size?: number;
  }): Observable<PagedResponse<AssetRequest>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) p = p.set(k, v); });
    return this.http.get<PagedResponse<AssetRequest>>(`${this.base}/requests`, { params: p });
  }

  getRequest(id: string): Observable<AssetRequest> {
    return this.http.get<AssetRequest>(`${this.base}/requests/${id}`);
  }

  submitRequest(req: RequestCreateRequest): Observable<AssetRequest> {
    return this.http.post<AssetRequest>(`${this.base}/requests`, req);
  }

  approveRequest(id: string, review: ReviewRequest): Observable<AssetRequest> {
    return this.http.post<AssetRequest>(`${this.base}/requests/${id}/approve`, review);
  }

  rejectRequest(id: string, review: ReviewRequest): Observable<AssetRequest> {
    return this.http.post<AssetRequest>(`${this.base}/requests/${id}/reject`, review);
  }

  allocateRequest(id: string, assetId: string): Observable<AssetRequest> {
    return this.http.post<AssetRequest>(`${this.base}/requests/${id}/allocate`, null, {
      params: { assetId }
    });
  }

  // ─── Users ────────────────────────────────────────────────
  getUsers(params: { search?: string; page?: number; size?: number }): Observable<PagedResponse<User>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) p = p.set(k, v); });
    return this.http.get<PagedResponse<User>>(`${this.base}/users`, { params: p });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/users/${id}`);
  }

  getUserAssets(id: string): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${this.base}/users/${id}/assets`);
  }

  updateUserStatus(id: string, enabled: boolean): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}/toggle-status`, {});
  }

  updateUserRole(id: string, role: string): Observable<User> {
    return this.http.put<User>(`${this.base}/users/${id}/role`, {}, {
      params: { role }
    });
  }

  // ─── Notifications ────────────────────────────────────────
  getNotifications(page = 0, size = 20): Observable<PagedResponse<Notification>> {
    return this.http.get<PagedResponse<Notification>>(`${this.base}/notifications`, {
      params: { page, size }
    });
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.base}/notifications/mark-all-read`, {});
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/notifications/unread-count`);
  }
}
