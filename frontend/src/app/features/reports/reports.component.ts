import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats } from '../../shared/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Reports & Analytics</h1>
        <p class="page-sub">{{ currentQuarter }} · generated {{ today | date:'mediumDate' }}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" (click)="exportCsv()">Export CSV</button>
        <button class="btn btn-primary" (click)="exportPdf()">Export PDF</button>
      </div>
    </div>

    <div class="stats-grid" *ngIf="stats()">
      <div class="stat-card blue">
        <div class="stat-label">Utilization</div>
        <div class="stat-value blue">{{ utilization() }}%</div>
        <div class="stat-delta"><span class="up">+3%</span> vs last quarter</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Available Assets</div>
        <div class="stat-value green">{{ stats()!.availableAssets }}</div>
        <div class="stat-delta">ready to deploy</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-label">Near EOL</div>
        <div class="stat-value amber">{{ stats()!.assetsNearEol }}</div>
        <div class="stat-delta">within 60 days</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Refresh Budget</div>
        <div class="stat-value red">₹{{ (stats()!.refreshBudget / 100000).toFixed(1) }}L</div>
        <div class="stat-delta">next 12 months</div>
      </div>
    </div>

    <div class="two-col" *ngIf="stats()">
      <!-- Asset by category -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Assets by Category</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Category</th><th>Count</th><th>Share</th><th>Distribution</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of categoryRows()">
                <td><span class="asset-name">{{ entry.key }}</span></td>
                <td>{{ entry.value }}</td>
                <td class="text-muted">{{ share(entry.value) }}%</td>
                <td>
                  <div class="inline-bar-bg">
                    <div class="inline-bar-fill" [style.width]="share(entry.value) + '%'"
                         [style.background]="catColor(entry.key)"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Status breakdown -->
      <div class="right-col">
        <div class="panel">
          <div class="panel-header"><div class="panel-title">Status Breakdown</div></div>
          <div class="cat-list" *ngIf="stats()">
            <div class="cat-row" *ngFor="let entry of statusRows()">
              <div class="cat-label">{{ entry.key | titlecase }}</div>
              <div class="cat-bar-bg">
                <div class="cat-bar-fill"
                     [style.width]="statusShare(entry.value) + '%'"
                     [style.background]="statusColor(entry.key)"></div>
              </div>
              <div class="cat-count">{{ entry.value }}</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><div class="panel-title">Request Activity</div></div>
          <div style="padding: 16px">
            <div class="report-kpi">
              <span class="report-kpi-label">Pending Approvals</span>
              <span class="report-kpi-value amber">{{ stats()!.pendingRequests }}</span>
            </div>
            <div class="report-kpi">
              <span class="report-kpi-label">Approved (open)</span>
              <span class="report-kpi-value green">{{ stats()!.approvedRequests }}</span>
            </div>
            <div class="report-kpi">
              <span class="report-kpi-label">Total Assets</span>
              <span class="report-kpi-value blue">{{ stats()!.totalAssets }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quarterly chart -->
    <div class="panel" *ngIf="stats()">
      <div class="panel-header">
        <div class="panel-title">Quarterly Asset Trend</div>
      </div>
      <div class="chart-area">
        <div class="chart-bars">
          <div class="bar-col" *ngFor="let q of quarters">
            <div class="bar" [style.height]="q.pct + '%'"
                 [style.opacity]="q.current ? '1' : '0.55'"
                 [style.background]="'var(--accent)'"></div>
            <div class="bar-label">{{ q.label }}</div>
          </div>
        </div>
        <div class="chart-legend">total assets in circulation by quarter</div>
      </div>
    </div>
  `,
  styles: [`
    .inline-bar-bg { height: 6px; background: var(--surface2); border-radius: 3px; min-width: 80px; }
    .inline-bar-fill { height: 100%; border-radius: 3px; transition: width .4s ease; }
    .chart-area { padding: 16px 20px 20px; }
    .chart-bars { display: flex; align-items: flex-end; gap: 10px; height: 100px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; }
    .bar { width: 100%; border-radius: 4px 4px 0 0; cursor: pointer; transition: opacity .15s; }
    .bar:hover { opacity: .75 !important; }
    .bar-label { font-size: 10px; font-family: var(--font-mono, monospace); color: var(--text3); }
    .chart-legend { text-align: center; font-size: 11px; color: var(--text3); margin-top: 8px; font-family: var(--font-mono, monospace); }
    .report-kpi { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .report-kpi:last-child { border-bottom: none; }
    .report-kpi-label { font-size: 12px; color: var(--text2); }
    .report-kpi-value { font-size: 20px; font-weight: 600; font-family: var(--font-mono, monospace); }
    .report-kpi-value.blue { color: var(--accent); }
    .report-kpi-value.green { color: var(--green); }
    .report-kpi-value.amber { color: var(--amber); }
  `]
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<DashboardStats | null>(null);
  today = new Date();

  get currentQuarter(): string {
    const q = Math.floor(this.today.getMonth() / 3) + 1;
    return `Q${q} ${this.today.getFullYear()}`;
  }

  quarters = [
    { label: "Q1'24", pct: 48, current: false },
    { label: "Q2'24", pct: 58, current: false },
    { label: "Q3'24", pct: 65, current: false },
    { label: "Q4'24", pct: 74, current: false },
    { label: "Q1'25", pct: 82, current: false },
    { label: "Q2'25", pct: 91, current: true },
  ];

  private colorMap: Record<string, string> = {
    LAPTOP: 'var(--accent)', DESKTOP: 'var(--accent2)', MONITOR: 'var(--green)',
    MOBILE: 'var(--amber)', LICENSE: 'var(--red)', default: 'var(--text3)'
  };

  private statusColorMap: Record<string, string> = {
    AVAILABLE: 'var(--green)', ASSIGNED: 'var(--accent)',
    MAINTENANCE: 'var(--amber)', RETIRED: 'var(--red)', default: 'var(--text3)'
  };

  ngOnInit() { this.api.getDashboardStats().subscribe(s => this.stats.set(s)); }

  utilization(): number {
    const s = this.stats();
    if (!s || s.totalAssets === 0) return 0;
    return Math.round(((s.totalAssets - s.availableAssets) / s.totalAssets) * 100);
  }

  categoryRows() {
    return Object.entries(this.stats()?.assetsByCategory ?? {})
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value);
  }

  statusRows() {
    return Object.entries(this.stats()?.assetsByStatus ?? {})
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({ key, value }));
  }

  share(val: number): number {
    const total = this.stats()?.totalAssets || 1;
    return Math.round((val / total) * 100);
  }

  statusShare(val: number): number {
    const total = this.stats()?.totalAssets || 1;
    return Math.round((val / total) * 100);
  }

  catColor(k: string) { return this.colorMap[k] || this.colorMap['default']; }
  statusColor(k: string) { return this.statusColorMap[k] || this.statusColorMap['default']; }

  exportCsv() {
    const rows = this.categoryRows().map(e => [e.key, e.value, this.share(e.value) + '%']);
    const csv = [['Category', 'Count', 'Share'], ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'assetops-report.csv'; a.click();
  }

  exportPdf() {
    window.print();
  }
}
