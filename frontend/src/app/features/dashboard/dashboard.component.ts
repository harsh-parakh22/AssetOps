import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats, Asset, AssetRequest } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Asset lifecycle overview · {{ currentQuarter }}</p>
      </div>
      <button class="btn btn-primary" routerLink="/requests">+ New Request</button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid" *ngIf="stats()">
      <div class="stat-card blue">
        <div class="stat-label">Total Assets</div>
        <div class="stat-value blue">{{ stats()!.totalAssets }}</div>
        <div class="stat-delta"><span class="up">↑</span> this quarter</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Available</div>
        <div class="stat-value green">{{ stats()!.availableAssets }}</div>
        <div class="stat-delta"><span class="up">↑</span> from last month</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-label">Pending Requests</div>
        <div class="stat-value amber">{{ stats()!.pendingRequests }}</div>
        <div class="stat-delta">{{ stats()!.approvedRequests }} approved</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Due for Refresh</div>
        <div class="stat-value red">{{ stats()!.assetsNearEol }}</div>
        <div class="stat-delta">within 60 days</div>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="two-col" *ngIf="stats()">
      <!-- Recent assets table -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Recent Asset Activity</div>
          <div class="filter-tabs">
            <div class="filter-tab" [class.active]="activeFilter() === 'ALL'" (click)="setFilter('ALL')">All</div>
            <div class="filter-tab" [class.active]="activeFilter() === 'HARDWARE'" (click)="setFilter('HARDWARE')">Hardware</div>
            <div class="filter-tab" [class.active]="activeFilter() === 'LICENSE'" (click)="setFilter('LICENSE')">Licenses</div>
          </div>
        </div>

        <!-- Desktop table -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th><th>Assigned To</th><th>Status</th><th>Updated</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let asset of filteredAssets()">
                <td>
                  <div class="asset-name">{{ asset.name }}</div>
                  <div class="asset-id">{{ asset.assetTag }}</div>
                </td>
                <td>{{ asset.assignedToName || '—' }}</td>
                <td><span class="chip" [ngClass]="asset.status.toLowerCase()">{{ asset.status }}</span></td>
                <td class="text-muted">{{ asset.updatedAt | date:'short' }}</td>
                <td><a class="action-btn" [routerLink]="['/inventory', asset.id]">View</a></td>
              </tr>
              <tr *ngIf="!filteredAssets().length">
                <td colspan="5" class="empty-row">No assets found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="mobile-cards">
          <div class="m-card" *ngFor="let asset of filteredAssets()">
            <div class="m-card-top">
              <div>
                <div class="asset-name">{{ asset.name }}</div>
                <div class="asset-id">{{ asset.assetTag }}</div>
              </div>
              <span class="chip" [ngClass]="asset.status.toLowerCase()">{{ asset.status }}</span>
            </div>
            <div class="m-card-row">
              <span class="text-muted">{{ asset.assignedToName || 'Unassigned' }}</span>
              <span class="text-muted">{{ asset.updatedAt | date:'mediumDate' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div class="right-col">
        <!-- Category breakdown -->
        <div class="panel">
          <div class="panel-header"><div class="panel-title">Assets by Category</div></div>
          <div class="cat-list" *ngIf="stats()">
            <div class="cat-row" *ngFor="let entry of categoryEntries()">
              <div class="cat-label">{{ entry.key }}</div>
              <div class="cat-bar-bg">
                <div class="cat-bar-fill"
                     [style.width]="getBarWidth(entry.value) + '%'"
                     [style.background]="getCategoryColor(entry.key)">
                </div>
              </div>
              <div class="cat-count">{{ entry.value }}</div>
            </div>
          </div>
        </div>

        <!-- Live activity -->
        <div class="panel">
          <div class="panel-header"><div class="panel-title">Live Activity</div></div>
          <div class="activity-item" *ngFor="let req of recentRequests()">
            <div class="a-dot" [style.background]="getStatusColor(req.status)"></div>
            <div class="a-body">
              <div class="a-text">
                <strong>{{ req.requestedByName }}</strong> {{ describeRequest(req) }}
              </div>
              <div class="a-time">{{ req.createdAt | date:'shortTime' }}</div>
            </div>
          </div>
          <div class="empty-activity" *ngIf="!recentRequests().length">
            No recent activity
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  stats = signal<DashboardStats | null>(null);
  recentAssets = signal<Asset[]>([]);
  recentRequests = signal<AssetRequest[]>([]);
  activeFilter = signal<'ALL' | 'HARDWARE' | 'LICENSE'>('ALL');

  get currentQuarter(): string {
    const today = new Date();
    const q = Math.floor(today.getMonth() / 3) + 1;
    return `Q${q} ${today.getFullYear()}`;
  }

  private categoryColors: Record<string, string> = {
    LAPTOP: 'var(--accent)', DESKTOP: 'var(--accent)',
    MONITOR: 'var(--accent2)', LICENSE: 'var(--green)',
    MOBILE: 'var(--amber)', TABLET: 'var(--amber)',
    PERIPHERAL: 'var(--red)', default: 'var(--text3)'
  };

  private readonly HARDWARE_CATEGORIES = ['LAPTOP', 'DESKTOP', 'MONITOR', 'PERIPHERAL', 'MOBILE', 'TABLET'];

  filteredAssets = computed(() => {
    const list = this.recentAssets();
    const filter = this.activeFilter();
    if (filter === 'ALL') return list;
    if (filter === 'HARDWARE') {
      return list.filter(a => this.HARDWARE_CATEGORIES.includes(a.category?.toUpperCase()));
    }
    // LICENSE
    return list.filter(a => a.category?.toUpperCase() === 'LICENSE');
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.api.getDashboardStats().subscribe(s => this.stats.set(s));

    this.api.getAssets({ page: 0, size: 10, sortBy: 'updatedAt', sortDir: 'DESC' })
      .subscribe(r => this.recentAssets.set(r.content));

    this.api.getRequests({ page: 0, size: 4 })
      .subscribe(r => this.recentRequests.set(r.content));
  }

  setFilter(f: 'ALL' | 'HARDWARE' | 'LICENSE'): void {
    this.activeFilter.set(f);
  }

  categoryEntries(): { key: string; value: number }[] {
    const map = this.stats()?.assetsByCategory || {};
    return Object.entries(map)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  getBarWidth(value: number): number {
    const max = Math.max(...this.categoryEntries().map(e => e.value));
    return max > 0 ? Math.round((value / max) * 100) : 0;
  }

  getCategoryColor(key: string): string {
    return this.categoryColors[key] || this.categoryColors['default'];
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'var(--accent2)', APPROVED: 'var(--green)',
      REJECTED: 'var(--red)', ALLOCATED: 'var(--accent)',
      RETURNED: 'var(--text3)'
    };
    return map[status] || 'var(--text3)';
  }

  describeRequest(req: AssetRequest): string {
    switch (req.status) {
      case 'PENDING': return `requested ${req.requestedAssetType || req.assetName || 'an asset'}`;
      case 'APPROVED': return `request was approved`;
      case 'REJECTED': return `request was rejected`;
      case 'ALLOCATED': return `received ${req.assetName || 'asset'}`;
      default: return `updated a request`;
    }
  }
}
