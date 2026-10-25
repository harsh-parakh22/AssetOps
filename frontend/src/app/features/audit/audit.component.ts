import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Audit Trail & Activity Log</h1>
        <p class="page-sub">{{ pagination().totalElements }} recorded events &bull; immutable administrative history</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" (click)="exportCsv()">Export CSV</button>
        <button class="btn btn-primary" (click)="loadAuditLogs()">Refresh</button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="search-field">
        <span>⌕</span>
        <input type="text" placeholder="Filter by action or details..."
               [(ngModel)]="searchFilter" (ngModelChange)="applyLocalFilter()" />
      </div>
      <select [(ngModel)]="entityTypeFilter" (ngModelChange)="loadAuditLogs()">
        <option value="">All Entity Types</option>
        <option value="Asset">Asset</option>
        <option value="AssetRequest">Asset Request</option>
        <option value="User">User</option>
      </select>
      <button class="btn btn-ghost btn-sm" (click)="clearFilters()">Clear</button>
    </div>

    <!-- Panel Table -->
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details & Values</th>
              <th>Performed By</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredLogs()">
              <td class="text-muted" style="white-space: nowrap;">
                {{ item.createdAt | date:'medium' }}
              </td>
              <td>
                <span class="action-pill" [ngClass]="item.action?.toLowerCase()">
                  {{ item.action }}
                </span>
              </td>
              <td>
                <strong>{{ item.entityType }}</strong>
              </td>
              <td>
                <div *ngIf="item.oldValue" class="val-row text-muted">
                  <span class="val-label">Previous:</span> {{ item.oldValue }}
                </div>
                <div *ngIf="item.newValue" class="val-row">
                  <span class="val-label">New:</span> <strong>{{ item.newValue }}</strong>
                </div>
                <span *ngIf="!item.oldValue && !item.newValue">—</span>
              </td>
              <td>
                <span class="user-badge">{{ item.performedBy || 'System' }}</span>
              </td>
            </tr>
            <tr *ngIf="!filteredLogs().length && !loading()">
              <td colspan="5" class="empty-row">No audit log records found</td>
            </tr>
            <tr *ngIf="loading()">
              <td colspan="5" class="empty-row">Loading audit records...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="pagination().totalPages > 1">
        <button class="btn btn-ghost btn-sm" [disabled]="pagination().first" (click)="changePage(currentPage() - 1)">
          &larr; Previous
        </button>
        <span class="page-info">Page {{ currentPage() + 1 }} of {{ pagination().totalPages }}</span>
        <button class="btn btn-ghost btn-sm" [disabled]="pagination().last" (click)="changePage(currentPage() + 1)">
          Next &rarr;
        </button>
      </div>
    </div>
  `,
  styles: [`
    .filters-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;

      .search-field {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r);
        padding: 0 12px;
        height: 38px;
        flex: 1;
        min-width: 200px;

        input {
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 13.5px;
          width: 100%;
        }
      }

      select {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r);
        padding: 0 12px;
        height: 38px;
        color: var(--text);
        font-size: 13px;
        cursor: pointer;
      }
    }

    .action-pill {
      font-size: 10.5px;
      font-weight: 700;
      font-family: var(--mono);
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      background: var(--surface2);
      color: var(--text2);

      &.create { background: var(--green-bg); color: var(--green); }
      &.update { background: rgba(47, 129, 247, 0.12); color: var(--accent); }
      &.assign { background: var(--purple-bg); color: var(--purple); }
      &.return { background: var(--amber-bg); color: var(--amber); }
    }

    .val-row {
      font-size: 12.5px;
      line-height: 1.4;

      .val-label {
        font-size: 10.5px;
        color: var(--text3);
        text-transform: uppercase;
        margin-right: 4px;
      }
    }

    .user-badge {
      font-size: 12px;
      background: var(--surface2);
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 4px;
      color: var(--text);
      font-family: var(--mono);
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-top: 1px solid var(--border);

      .page-info {
        font-size: 12.5px;
        color: var(--text2);
      }
    }

    .empty-row {
      text-align: center;
      padding: 36px 0;
      color: var(--text3);
    }
  `]
})
export class AuditComponent implements OnInit {
  private api = inject(ApiService);

  logs = signal<any[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  pagination = signal({ totalElements: 0, totalPages: 1, first: true, last: true });

  searchFilter = '';
  entityTypeFilter = '';

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loading.set(true);
    this.api.getAuditLogs({
      page: this.currentPage(),
      size: 20,
      entityType: this.entityTypeFilter || undefined
    }).subscribe({
      next: res => {
        this.logs.set(res.content || []);
        this.pagination.set({
          totalElements: res.totalElements,
          totalPages: res.totalPages,
          first: res.first,
          last: res.last
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredLogs(): any[] {
    const list = this.logs();
    if (!this.searchFilter.trim()) return list;
    const q = this.searchFilter.toLowerCase().trim();
    return list.filter(item =>
      (item.action && item.action.toLowerCase().includes(q)) ||
      (item.entityType && item.entityType.toLowerCase().includes(q)) ||
      (item.newValue && item.newValue.toLowerCase().includes(q)) ||
      (item.oldValue && item.oldValue.toLowerCase().includes(q)) ||
      (item.performedBy && item.performedBy.toLowerCase().includes(q))
    );
  }

  applyLocalFilter(): void {
    // Pure reactive filter via computed/method
  }

  clearFilters(): void {
    this.searchFilter = '';
    this.entityTypeFilter = '';
    this.currentPage.set(0);
    this.loadAuditLogs();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadAuditLogs();
  }

  exportCsv(): void {
    const headers = ['Timestamp', 'Action', 'Entity Type', 'Previous Value', 'New Value', 'Performed By'];
    const rows = this.logs().map(log => [
      log.createdAt || '',
      log.action || '',
      log.entityType || '',
      `"${(log.oldValue || '').replace(/"/g, '""')}"`,
      `"${(log.newValue || '').replace(/"/g, '""')}"`,
      log.performedBy || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assetops-audit-trail.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
