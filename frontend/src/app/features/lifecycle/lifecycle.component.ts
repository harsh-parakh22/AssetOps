import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Asset, RequestCreateRequest, Priority } from '../../shared/models';

@Component({
  selector: 'app-lifecycle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Lifecycle Tracker</h1>
        <p class="page-sub">{{ eolAssets().length }} assets approaching end-of-life</p>
      </div>
      <button class="btn btn-ghost" (click)="exportCsv()">Export Report</button>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Assets Requiring Attention</div>
        <div class="filter-tabs">
          <div class="filter-tab" [class.active]="filter() === ''" (click)="filter.set('')">All</div>
          <div class="filter-tab" [class.active]="filter() === 'NEAR_EOL'" (click)="filter.set('NEAR_EOL')">Near EOL</div>
          <div class="filter-tab" [class.active]="filter() === 'EOL'" (click)="filter.set('EOL')">Expired</div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th><th>Category</th><th>Assigned To</th>
              <th>Age</th><th>Refresh Due</th><th>Stage</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let asset of filteredAssets()">
              <td>
                <div class="asset-name">{{ asset.name }}</div>
                <div class="asset-id">{{ asset.assetTag }}</div>
              </td>
              <td>{{ asset.category }}</td>
              <td>{{ asset.assignedToName || '—' }}</td>
              <td class="text-muted">{{ asset.ageInMonths }} mo</td>
              <td [style.color]="isPastDue(asset) ? 'var(--red)' : 'var(--amber)'">
                {{ asset.refreshDate | date:'MMM yyyy' }}
              </td>
              <td>
                <span class="chip" [ngClass]="(asset.lifecycleStage || 'active').toLowerCase()">
                  {{ asset.lifecycleStage }}
                </span>
              </td>
              <td>
                <button class="action-btn" *ngIf="!isPastDue(asset)" (click)="scheduleRefresh(asset)">Schedule Refresh</button>
                <button class="action-btn reject" *ngIf="isPastDue(asset)" (click)="markRetired(asset)">Mark Retired</button>
              </td>
            </tr>
            <tr *ngIf="!filteredAssets().length">
              <td colspan="7" class="empty-row">All assets are within lifecycle. 🎉</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-cards">
        <div class="m-card" *ngFor="let asset of filteredAssets()">
          <div class="m-card-top">
            <div>
              <div class="asset-name">{{ asset.name }}</div>
              <div class="asset-id">{{ asset.assetTag }} · {{ asset.ageInMonths }}mo old</div>
            </div>
            <span class="chip" [ngClass]="(asset.lifecycleStage || 'active').toLowerCase()">
              {{ asset.lifecycleStage }}
            </span>
          </div>
          <div class="m-card-row">
            <span class="text-muted">{{ asset.assignedToName || 'Unassigned' }}</span>
            <span [style.color]="isPastDue(asset) ? 'var(--red)' : 'var(--amber)'">
              {{ asset.refreshDate | date:'MMM yyyy' }}
            </span>
          </div>
          <div class="m-actions">
            <button class="action-btn" *ngIf="!isPastDue(asset)" (click)="scheduleRefresh(asset)">Refresh</button>
            <button class="action-btn reject" *ngIf="isPastDue(asset)" (click)="markRetired(asset)">Retire</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LifecycleComponent implements OnInit {
  private api = inject(ApiService);
  eolAssets = signal<Asset[]>([]);
  filter = signal('');

  ngOnInit() { this.loadEolAssets(); }

  loadEolAssets() {
    this.api.getEolAssets(90).subscribe(a => this.eolAssets.set(a));
  }

  filteredAssets() {
    const f = this.filter();
    return f ? this.eolAssets().filter(a => a.lifecycleStage === f) : this.eolAssets();
  }

  isPastDue(asset: Asset): boolean {
    return !!asset.refreshDate && new Date(asset.refreshDate) < new Date();
  }

  markRetired(asset: Asset) {
    if (confirm(`Are you sure you want to retire ${asset.name} (${asset.assetTag})? This will unassign the user.`)) {
      this.api.updateAsset(asset.id, { status: 'RETIRED' }).subscribe(() => {
        this.loadEolAssets();
      });
    }
  }

  scheduleRefresh(asset: Asset) {
    const req: RequestCreateRequest = {
      requestedAssetType: `Replacement for ${asset.name}`,
      reason: `Scheduled refresh for end-of-life asset (${asset.assetTag}).`,
      priority: 'HIGH'
    };
    
    this.api.submitRequest(req).subscribe(() => {
      alert(`Refresh scheduled for ${asset.name}. Procurement ticket created.`);
      // Optionally reload or change UI state if needed
    });
  }

  exportCsv() {
    const rows = this.eolAssets().map(a => [
      a.assetTag, a.name, a.category,
      a.assignedToName || '', a.ageInMonths + 'mo',
      a.refreshDate || '', a.lifecycleStage || ''
    ]);
    const csv = [['Tag','Name','Category','Assigned To','Age','Refresh Date','Stage'], ...rows]
      .map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'eol-report.csv'; a.click();
  }
}
