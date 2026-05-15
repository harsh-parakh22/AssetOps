import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User, Role } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);

  private readonly TOKEN_KEY = 'ao_access_token';
  private readonly REFRESH_KEY = 'ao_refresh_token';
  private readonly USER_KEY = 'ao_user';

  // Reactive state
  private _currentUser = new BehaviorSubject<User | null>(this.loadUser());
  currentUser$ = this._currentUser.asObservable();

  // Signals for modern Angular patterns
  currentUserSignal = signal<User | null>(this.loadUser());
  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  isAdmin = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === 'IT_ADMIN' || role === 'SUPER_ADMIN';
  });
  isSuperAdmin = computed(() => this.currentUserSignal()?.role === 'SUPER_ADMIN');

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => throwError(() => err))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, req).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.next(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasRole(role: Role): boolean {
    return this.currentUserSignal()?.role === role;
  }

  hasAnyRole(...roles: Role[]): boolean {
    const userRole = this.currentUserSignal()?.role;
    return userRole ? roles.includes(userRole) : false;
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.REFRESH_KEY, res.refreshToken);

    const user: User = {
      id: res.userId,
      name: res.name,
      email: res.email,
      role: res.role,
      employeeId: '',
      enabled: true,
      assignedAssetCount: 0,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._currentUser.next(user);
    this.currentUserSignal.set(user);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
