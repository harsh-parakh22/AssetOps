import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <!-- Logo -->
        <div class="auth-logo">
          <div class="logo-mark">IT</div>
          <div>
            <div class="auth-brand">AssetOps</div>
            <div class="auth-tagline">IT ASSET MANAGEMENT</div>
          </div>
        </div>

        <!-- Login / Register tabs -->
        <div class="auth-tabs">
          <button class="auth-tab" [class.active]="mode()==='login'" (click)="mode.set('login')">Sign In</button>
          <button class="auth-tab" [class.active]="mode()==='register'" (click)="mode.set('register')">Register</button>
        </div>

        <!-- LOGIN FORM -->
        <ng-container *ngIf="mode()==='login'">
          <h1 class="auth-title">Welcome back</h1>
          <p class="auth-sub">Sign in to your account to continue</p>
          <div class="auth-error" *ngIf="error()">{{ error() }}</div>
          <form [formGroup]="loginForm" (ngSubmit)="login()">
            <div class="form-group" style="margin-bottom:14px">
              <label>Email address</label>
              <input type="email" formControlName="email" placeholder="admin@assetops.com" autocomplete="email" />
            </div>
            <div class="form-group" style="margin-bottom:20px">
              <label>Password</label>
              <input type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password" />
            </div>
            <button type="submit" class="btn btn-primary auth-submit" [disabled]="loginForm.invalid || loading()">
              {{ loading() ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>
          <p class="auth-hint">Demo: admin&#64;assetops.com / Admin&#64;123</p>
        </ng-container>

        <!-- REGISTER FORM -->
        <ng-container *ngIf="mode()==='register'">
          <h1 class="auth-title">Create account</h1>
          <p class="auth-sub">Fill in your details to get started</p>
          <div class="auth-error" *ngIf="error()">{{ error() }}</div>
          <div class="auth-success" *ngIf="success()">{{ success() }}</div>
          <form [formGroup]="registerForm" (ngSubmit)="register()">
            <div class="form-grid" style="margin-bottom:0">
              <div class="form-group" style="margin-bottom:14px">
                <label>Full Name *</label>
                <input formControlName="name" placeholder="Priya Sharma" />
              </div>
              <div class="form-group" style="margin-bottom:14px">
                <label>Employee ID *</label>
                <input formControlName="employeeId" placeholder="EMP-1001" />
              </div>
              <div class="form-group full-width" style="margin-bottom:14px">
                <label>Email address *</label>
                <input type="email" formControlName="email" placeholder="priya@company.com" />
              </div>
              <div class="form-group" style="margin-bottom:14px">
                <label>Password *</label>
                <input type="password" formControlName="password" placeholder="Min 6 characters" />
              </div>
              <div class="form-group" style="margin-bottom:14px">
                <label>Department</label>
                <input formControlName="department" placeholder="Engineering" />
              </div>
              <div class="form-group full-width" style="margin-bottom:20px">
                <label>Job Title</label>
                <input formControlName="jobTitle" placeholder="Senior Developer" />
              </div>
            </div>
            <button type="submit" class="btn btn-primary auth-submit" [disabled]="registerForm.invalid || loading()">
              {{ loading() ? 'Creating account…' : 'Create account' }}
            </button>
          </form>
        </ng-container>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  mode = signal<'login'|'register'>('login');
  loading = signal(false);
  error = signal('');
  success = signal('');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  registerForm = this.fb.group({
    employeeId: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    department: [''],
    jobTitle: ['']
  });

  login(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true); this.error.set('');
    this.auth.login(this.loginForm.value as any).subscribe({
      next: () => {
        const ret = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(ret || (this.auth.isAdmin() ? '/dashboard' : '/inventory'));
      },
      error: (err) => {
        this.error.set(this.extractErrorMessage(err, 'Invalid email or password'));
        this.loading.set(false);
      }
    });
  }

  register(): void {
    if (this.registerForm.invalid) return;
    this.loading.set(true); this.error.set(''); this.success.set('');
    this.auth.register(this.registerForm.value as any).subscribe({
      next: () => {
        this.success.set('Account created! You can now sign in.');
        this.registerForm.reset();
        this.loading.set(false);
        setTimeout(() => this.mode.set('login'), 2000);
      },
      error: (err) => {
        this.error.set(this.extractErrorMessage(err, 'Registration failed. Email may already exist.'));
        this.loading.set(false);
      }
    });
  }

  private extractErrorMessage(err: any, fallback: string): string {
    // Backend returned a JSON error body (ProblemDetail)
    if (err.error && typeof err.error === 'object' && !err.error.constructor?.name?.includes('Error')) {
      return err.error.detail || err.error.message || fallback;
    }
    // Backend is down — Nginx returned HTML or connection refused
    if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
      return 'Server is starting up or unavailable. Please try again in a moment.';
    }
    // JSON parse error (Angular couldn't parse HTML as JSON)
    if (typeof err.error === 'string' && err.error.includes('<html')) {
      return 'Server is starting up or unavailable. Please try again in a moment.';
    }
    if (err.error instanceof SyntaxError || (typeof err.message === 'string' && err.message.includes('Unexpected token'))) {
      return 'Server is starting up or unavailable. Please try again in a moment.';
    }
    return fallback;
  }
}
