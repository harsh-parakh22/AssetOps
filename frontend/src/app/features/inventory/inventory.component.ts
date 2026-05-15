import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Asset, AssetStatus, AssetCategory, PagedResponse, User } from '../../shared/models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventory</h1>
        <p class="page-sub">{{ pagination().totalElements }} assets · last synced just now</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" (click)="exportCsv()">Export CSV</button>
        <button class="btn btn-primary" *ngIf="auth.isAdmin()" (click)="openModal('create')">+ Add Asset</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-field">
        <span>⌕</span>
        <input type="text" placeholder="Search name, tag, serial…"
               [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()" />
      </div>
      <select [(ngModel)]="filters.status" (ngModelChange)="onFilterChange()">
        <option value="">All Status</option>
        <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
      </select>
      <select [(ngModel)]="filters.category" (ngModelChange)="onFilterChange()">
        <option value="">All Categories</option>
        <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
      </select>
      <button class="btn btn-ghost btn-sm" (click)="clearFilters()">Clear</button>
    </div>

    <!-- Desktop Table -->
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Category</th>
              <th>Assigned To</th><th>Location</th>
              <th>Status</th><th>Refresh Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let asset of assets()">
              <td><span class="asset-id">{{ asset.assetTag }}</span></td>
              <td><div class="asset-name">{{ asset.name }}</div></td>
              <td>{{ asset.category }}</td>
              <td>{{ asset.assignedToName || '—' }}</td>
              <td>{{ asset.location || '—' }}</td>
              <td><span class="chip" [ngClass]="asset.status.toLowerCase()">{{ asset.status }}</span></td>
              <td class="text-muted">{{ asset.refreshDate | date:'MMM yyyy' }}</td>
              <td>
                <div class="row-actions">
                  <a class="action-btn" [routerLink]="['/inventory', asset.id]">View</a>
                  <button class="action-btn" *ngIf="auth.isAdmin()" (click)="openModal('edit', asset)">Edit</button>
                  <button class="action-btn approve" *ngIf="auth.isAdmin() && asset.status === 'AVAILABLE'"
                          (click)="openAssignModal(asset)">Assign</button>
                  <button class="action-btn reject" *ngIf="auth.isAdmin() && asset.status === 'ASSIGNED'"
                          (click)="returnAsset(asset)">Return</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!assets().length && !loading()">
              <td colspan="8" class="empty-row">No assets found. Adjust your filters or add an asset.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="mobile-cards" *ngIf="!loading()">
        <div class="m-card" *ngFor="let asset of assets()">
          <div class="m-card-top">
            <div>
              <div class="asset-name">{{ asset.name }}</div>
              <div class="asset-id">{{ asset.assetTag }} · {{ asset.category }}</div>
            </div>
            <span class="chip" [ngClass]="asset.status.toLowerCase()">{{ asset.status }}</span>
          </div>
          <div class="m-card-row">
            <span class="text-muted">{{ asset.assignedToName || 'Unassigned' }}</span>
            <span class="text-muted">{{ asset.refreshDate | date:'MMM yyyy' }}</span>
          </div>
          <div class="m-actions">
            <a class="action-btn" [routerLink]="['/inventory', asset.id]">View</a>
            <button class="action-btn" *ngIf="auth.isAdmin()" (click)="openModal('edit', asset)">Edit</button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="pagination().totalPages > 1">
        <button class="page-btn" (click)="changePage(currentPage() - 1)" [disabled]="currentPage() === 0">‹</button>
        <span class="page-info">{{ currentPage() + 1 }} / {{ pagination().totalPages }}</span>
        <button class="page-btn" (click)="changePage(currentPage() + 1)"
                [disabled]="currentPage() >= pagination().totalPages - 1">›</button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-backdrop" *ngIf="showModal()" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalMode() === 'create' ? 'Add New Asset' : 'Edit Asset' }}</h2>
          <button class="modal-close" (click)="closeModal()">✕</button>
        </div>
        <form [formGroup]="assetForm" (ngSubmit)="submitAsset()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Asset Name *</label>
              <input formControlName="name" placeholder="MacBook Pro 16&quot;" />
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select formControlName="category">
                <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Manufacturer</label>
              <input formControlName="manufacturer" placeholder="Apple" />
            </div>
            <div class="form-group">
              <label>Model</label>
              <input formControlName="model" placeholder="MK193LL/A" />
            </div>
            <div class="form-group">
              <label>Serial Number</label>
              <input formControlName="serialNumber" placeholder="C02XG0JHJGH5" />
            </div>
            <div class="form-group">
              <label>Location</label>
              <input formControlName="location" placeholder="Bangalore HQ" />
            </div>
            <div class="form-group">
              <label>Purchase Date</label>
              <input type="date" formControlName="purchaseDate" />
            </div>
            <div class="form-group">
              <label>Purchase Cost (₹)</label>
              <input type="number" formControlName="purchaseCost" placeholder="150000" />
            </div>
            <div class="form-group">
              <label>Refresh Date</label>
              <input type="date" formControlName="refreshDate" />
            </div>
            <div class="form-group">
              <label>Warranty Expiry</label>
              <input type="date" formControlName="warrantyExpiry" />
            </div>
            <div class="form-group full-width">
              <label>Notes</label>
              <textarea formControlName="notes" rows="2" placeholder="Additional notes…"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="assetForm.invalid || submitting()">
              {{ submitting() ? 'Saving…' : (modalMode() === 'create' ? 'Create Asset' : 'Save Changes') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Assign Modal -->
    <div class="modal-backdrop" *ngIf="showAssignModal()" (click)="closeAssignModal()">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Assign Asset</h2>
          <button class="modal-close" (click)="closeAssignModal()">✕</button>
        </div>
        <div class="modal-body">
          <p class="review-info">Assigning <strong>{{ assigningAsset()?.name }}</strong> ({{ assigningAsset()?.assetTag }})</p>
          <div class="form-group">
            <label>Search User</label>
            <div class="search-field">
              <span>⌕</span>
              <input type="text" placeholder="Name or email..." [(ngModel)]="userSearch" (ngModelChange)="loadUsersForAssign()" />
            </div>
          </div>
          <div class="user-list-mini" *ngIf="users().length; else noUsers">
            <div class="user-item-mini" *ngFor="let user of users()" (click)="confirmAssign(user)">
              <div class="avatar-sm">{{ initials(user.name) }}</div>
              <div class="user-info-mini">
                <div class="u-name">{{ user.name }}</div>
                <div class="u-email">{{ user.email }}</div>
              </div>
              <span class="assign-hint">Click to Assign</span>
            </div>
          </div>
          <ng-template #noUsers>
            <div class="empty-row" style="padding: 20px 0">No users found</div>
          </ng-template>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" (click)="closeAssignModal()">Cancel</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  assets = signal<Asset[]>([]);
  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editingAsset = signal<Asset | null>(null);
  currentPage = signal(0);
  pagination = signal({ totalElements: 0, totalPages: 1, first: true, last: true });

  filters = { search: '', status: '', category: '' };

  statuses: AssetStatus[] = ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED', 'DISPOSED'];
  categories: AssetCategory[] = ['LAPTOP', 'DESKTOP', 'MONITOR', 'MOBILE', 'TABLET', 'PERIPHERAL', 'LICENSE', 'NETWORKING', 'SERVER', 'OTHER'];

  assetForm!: FormGroup;

  // Assign features
  showAssignModal = signal(false);
  assigningAsset = signal<Asset | null>(null);
  users = signal<User[]>([]);
  userSearch = '';

  ngOnInit(): void {
    this.buildForm();
    
    // Listen for query params (like search from layout)
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.filters.search = params['search'];
      }
      this.loadAssets();
    });
  }

  private buildForm(): void {
    this.assetForm = this.fb.group({
      name: ['', Validators.required],
      category: ['LAPTOP', Validators.required],
      manufacturer: [''], model: [''], serialNumber: [''],
      location: [''], purchaseDate: [''], purchaseCost: [null],
      refreshDate: [''], warrantyExpiry: [''], notes: ['']
    });
  }

  loadAssets(): void {
    this.loading.set(true);
    this.api.getAssets({
      search: this.filters.search || undefined,
      status: this.filters.status || undefined,
      category: this.filters.category || undefined,
      page: this.currentPage(),
      size: 15,
      sortBy: 'updatedAt',
      sortDir: 'DESC'
    }).subscribe({
      next: r => {
        this.assets.set(r.content);
        this.pagination.set({ totalElements: r.totalElements, totalPages: r.totalPages, first: r.first, last: r.last });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadAssets();
  }

  clearFilters(): void {
    this.filters = { search: '', status: '', category: '' };
    this.onFilterChange();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadAssets();
  }

  openModal(mode: 'create' | 'edit', asset?: Asset): void {
    this.modalMode.set(mode);
    if (mode === 'edit' && asset) {
      this.editingAsset.set(asset);
      this.assetForm.patchValue({
        name: asset.name, category: asset.category,
        manufacturer: asset.manufacturer, model: asset.model,
        serialNumber: asset.serialNumber, location: asset.location,
        purchaseDate: asset.purchaseDate, purchaseCost: asset.purchaseCost,
        refreshDate: asset.refreshDate, warrantyExpiry: asset.warrantyExpiry,
        notes: asset.notes
      });
    } else {
      this.editingAsset.set(null);
      this.assetForm.reset({ category: 'LAPTOP' });
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.assetForm.reset({ category: 'LAPTOP' });
  }

  submitAsset(): void {
    if (this.assetForm.invalid) return;
    this.submitting.set(true);
    const val = this.assetForm.value;

    const obs = this.modalMode() === 'create'
      ? this.api.createAsset(val)
      : this.api.updateAsset(this.editingAsset()!.id, val);

    obs.subscribe({
      next: () => { this.closeModal(); this.loadAssets(); this.submitting.set(false); },
      error: () => this.submitting.set(false)
    });
  }

  openAssignModal(asset: Asset): void {
    this.assigningAsset.set(asset);
    this.userSearch = '';
    this.loadUsersForAssign();
    this.showAssignModal.set(true);
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
    this.assigningAsset.set(null);
    this.users.set([]);
  }

  loadUsersForAssign(): void {
    this.api.getUsers({ search: this.userSearch || undefined, page: 0, size: 5 })
      .subscribe(r => this.users.set(r.content));
  }

  confirmAssign(user: User): void {
    const asset = this.assigningAsset();
    if (!asset) return;

    if (confirm(`Assign ${asset.name} to ${user.name}?`)) {
      this.api.assignAsset(asset.id, user.id).subscribe({
        next: () => {
          this.closeAssignModal();
          this.loadAssets();
        }
      });
    }
  }

  returnAsset(asset: Asset): void {
    if (confirm(`Return ${asset.name} (${asset.assetTag})?`)) {
      this.api.returnAsset(asset.id).subscribe(() => this.loadAssets());
    }
  }

  initials(name: string): string {
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  exportCsv(): void {
    const headers = ['Tag', 'Name', 'Category', 'Status', 'Assigned To', 'Location', 'Refresh Date'];
    const rows = this.assets().map(a => [
      a.assetTag, a.name, a.category, a.status,
      a.assignedToName || '', a.location || '', a.refreshDate || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'assets.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
