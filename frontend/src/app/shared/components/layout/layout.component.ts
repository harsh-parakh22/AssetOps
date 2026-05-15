import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ApiService } from '../../../core/services/api.service';
import { LoaderComponent } from '../loader/loader.component';
import { Subscription } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  badge?: number;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, LoaderComponent],
  template: `
    <app-loader></app-loader>
    <div class="shell" [class.light]="theme() === 'light'">
      <!-- Mobile overlay -->
      <div class="overlay" [class.open]="sidebarOpen()" (click)="closeSidebar()"></div>

      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-inner">
          <div class="logo">
            <div class="logo-icon">IT</div>
            <div class="logo-text-wrap">
              <div class="logo-name">AssetOps</div>
              <div class="logo-version">v1.0.0 · PROD</div>
            </div>
            <button class="sidebar-close" (click)="closeSidebar()">✕</button>
          </div>

          <nav class="nav">
            <div class="nav-section">Overview</div>
            <ng-container *ngFor="let item of navItems">
              <a *ngIf="!item.adminOnly || auth.isAdmin()"
                 class="nav-item"
                 [routerLink]="item.route"
                 routerLinkActive="active"
                 (click)="closeSidebar()">
                <span class="nav-icon">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
                <span *ngIf="item.badge" class="nav-badge">{{ item.badge }}</span>
              </a>
            </ng-container>
          </nav>

          <div class="user-bar">
            <div class="avatar">{{ initials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ auth.currentUserSignal()?.name }}</div>
              <div class="user-role">{{ auth.currentUserSignal()?.role | titlecase }}</div>
            </div>
            <button class="logout-btn" (click)="auth.logout()" title="Logout">⏏</button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <div class="main">
        <!-- Topbar -->
        <header class="topbar">
          <button class="menu-btn" (click)="toggleSidebar()">☰</button>
          <div class="topbar-spacer"></div>

          <div class="search-box">
            <span class="search-icon">⌕</span>
            <input type="text" placeholder="Search assets..."
                   [value]="searchQuery"
                   (input)="onSearch($event)"
                   (keyup.enter)="onSearch($event)"
                   class="search-input" />
          </div>

          <button class="theme-btn" (click)="toggleTheme()" [title]="theme() === 'dark' ? 'Light mode' : 'Dark mode'">
            {{ theme() === 'dark' ? '☀️' : '🌙' }}
          </button>

          <button class="notif-btn" [routerLink]="['/notifications']">
            🔔
            <span *ngIf="unreadCount() > 0" class="notif-badge">{{ unreadCount() }}</span>
          </button>
        </header>

        <!-- Page content -->
        <div class="content">
          <router-outlet />
        </div>
      </div>

      <!-- Bottom nav (mobile) -->
      <nav class="bottom-nav">
        <a class="bn-item" routerLink="/dashboard" routerLinkActive="active" *ngIf="auth.isAdmin()">
          <span class="bn-icon">⬡</span><span>Home</span>
        </a>
        <a class="bn-item" routerLink="/inventory" routerLinkActive="active">
          <span class="bn-icon">◧</span><span>Assets</span>
        </a>
        <a class="bn-item" routerLink="/requests" routerLinkActive="active">
          <span class="bn-icon">◈</span>
          <span>Requests</span>
          <span *ngIf="unreadCount() > 0" class="bn-badge">{{ unreadCount() }}</span>
        </a>
        <a class="bn-item" routerLink="/reports" routerLinkActive="active" *ngIf="auth.isAdmin()">
          <span class="bn-icon">▣</span><span>Reports</span>
        </a>
        <a class="bn-item" routerLink="/notifications" routerLinkActive="active">
          <span class="bn-icon">🔔</span><span>Alerts</span>
        </a>
      </nav>
    </div>
  `,
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  private ws = inject(WebSocketService);
  private api = inject(ApiService);

  sidebarOpen = signal(false);
  theme = signal<'dark' | 'light'>(
    (localStorage.getItem('ao_theme') as 'dark' | 'light') || 'dark'
  );
  unreadCount = signal(0);
  searchQuery = '';

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '⬡', route: '/dashboard', adminOnly: true },
    { label: 'Inventory', icon: '◧', route: '/inventory', adminOnly: true },
    { label: 'Requests', icon: '◈', route: '/requests' },
    { label: 'Lifecycle', icon: '◎', route: '/lifecycle', adminOnly: true },
    { label: 'Users', icon: '◉', route: '/users', adminOnly: true },
    { label: 'Reports', icon: '▣', route: '/reports', adminOnly: true }
  ];

  private sub?: Subscription;

  ngOnInit(): void {
    this.ws.connect();
    this.sub = this.ws.unreadCount$.subscribe(c => this.unreadCount.set(c));
    this.api.getUnreadCount().subscribe(r => this.ws.setUnreadCount(r.count));
    document.documentElement.setAttribute('data-theme', this.theme());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.ws.disconnect();
  }

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }
  closeSidebar(): void { this.sidebarOpen.set(false); }

  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('ao_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    
    // If Enter is pressed, navigate to inventory with search param
    if ((event as any).key === 'Enter' || event.type === 'change') {
      this.router.navigate(['/inventory'], { 
        queryParams: { search: this.searchQuery },
        queryParamsHandling: 'merge'
      });
    }
  }

  initials(): string {
    const name = this.auth.currentUserSignal()?.name || '';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
