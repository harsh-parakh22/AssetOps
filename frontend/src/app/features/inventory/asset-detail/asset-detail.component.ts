import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Asset, AssetCategory, User } from '../../../shared/models';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <button class="btn btn-ghost" (click)="router.navigate(['/inventory'])">← Back</button>
      <div style="flex:1">
        <h1 class="page-title">{{ asset()?.name || 'Asset Detail' }}</h1>
        <p class="page-sub">{{ asset()?.assetTag }} · {{ asset()?.category }}</p>
      </div>
      <div class="header-actions" *ngIf="auth.isAdmin() && asset()">
        <button class="btn btn-ghost" *ngIf="asset()!.status === 'ASSIGNED'" (click)="returnAsset()">
          Return Asset
        </button>
        <button class="btn btn-primary" (click)="openEditModal()">Edit Asset</button>
      </div>
    </div>

    <div class="detail-grid" *ngIf="asset(); else loading">
      <!-- Left: Main info -->
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header">
            <div class="panel-title">Asset Information</div>
            <span class="chip" [ngClass]="asset()!.status.toLowerCase()">{{ asset()!.status }}</span>
          </div>
          <div class="detail-rows">
            <div class="detail-row"><span class="detail-label">Asset Tag</span><span class="detail-value mono">{{ asset()!.assetTag }}</span></div>
            <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">{{ asset()!.name }}</span></div>
            <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">{{ asset()!.category }}</span></div>
            <div class="detail-row"><span class="detail-label">Manufacturer</span><span class="detail-value">{{ asset()!.manufacturer || '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Model</span><span class="detail-value">{{ asset()!.model || '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Serial Number</span><span class="detail-value mono">{{ asset()!.serialNumber || '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">{{ asset()!.location || '—' }}</span></div>
            <div class="detail-row" *ngIf="asset()!.description || asset()!.notes">
              <span class="detail-label">Notes</span>
              <span class="detail-value">{{ asset()!.notes || asset()!.description }}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><div class="panel-title">Financial & Lifecycle</div></div>
          <div class="detail-rows">
            <div class="detail-row"><span class="detail-label">Purchase Date</span><span class="detail-value">{{ asset()!.purchaseDate | date:'mediumDate' }}</span></div>
            <div class="detail-row"><span class="detail-label">Purchase Cost</span><span class="detail-value">{{ asset()!.purchaseCost ? '₹' + asset()!.purchaseCost!.toLocaleString() : '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Age</span><span class="detail-value">{{ asset()!.ageInMonths }} months</span></div>
            <div class="detail-row"><span class="detail-label">Refresh Due</span>
              <span class="detail-value" [style.color]="isNearEol() ? 'var(--amber)' : 'var(--text)'">
                {{ asset()!.refreshDate | date:'mediumDate' }}
              </span>
            </div>
            <div class="detail-row"><span class="detail-label">Warranty Expiry</span><span class="detail-value">{{ asset()!.warrantyExpiry | date:'mediumDate' }}</span></div>
            <div class="detail-row"><span class="detail-label">Lifecycle Stage</span>
              <span class="chip" [ngClass]="(asset()!.lifecycleStage || 'active').toLowerCase()">
                {{ asset()!.lifecycleStage }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Assignment info -->
      <div>
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-header"><div class="panel-title">Assignment</div></div>
          <div class="detail-rows" *ngIf="asset()!.assignedToId; else notAssigned">
            <div class="assigned-user">
              <div class="avatar-lg">{{ initials(asset()!.assignedToName!) }}</div>
              <div>
                <div class="asset-name">{{ asset()!.assignedToName }}</div>
                <div class="asset-id">{{ asset()!.assignedToEmail }}</div>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-label">Assigned Since</span>
              <span class="detail-value">{{ asset()!.assignedDate | date:'mediumDate' }}</span>
            </div>
          </div>
          <ng-template #notAssigned>
            <div class="unassigned-msg">
              <div class="unassigned-icon">◎</div>
              <div>Available for assignment</div>
              <button class="btn btn-primary" style="margin-top:12px" *ngIf="auth.isAdmin()" (click)="openAssignModal()">
                Assign to User
              </button>
            </div>
          </ng-template>
        </div>

        <div class="panel">
          <div class="panel-header"><div class="panel-title">Audit Trail</div></div>
          <div style="padding:12px 16px;font-size:12px;color:var(--text3)">
            <div style="margin-bottom:8px">Created {{ asset()!.createdAt | date:'medium' }}</div>
            <div>Last updated {{ asset()!.updatedAt | date:'medium' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal-backdrop" *ngIf="showEditModal()" (click)="closeEditModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Edit Asset</h2>
          <button class="modal-close" (click)="closeEditModal()">✕</button>
        </div>
        <form [formGroup]="editForm" (ngSubmit)="submitEdit()" class="modal-body">
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
            <button type="button" class="btn btn-ghost" (click)="closeEditModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="editForm.invalid || submitting()">
              {{ submitting() ? 'Saving…' : 'Save Changes' }}
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

    <ng-template #loading>
      <div class="loading-grid">
        <div class="skeleton" style="height:300px"></div>
        <div class="skeleton" style="height:300px"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
    .detail-rows { padding: 4px 0; }
    .detail-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 16px; border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
    }
    .detail-label { font-size: 12px; color: var(--text2); font-family: var(--font-mono, monospace); flex-shrink: 0; margin-right: 16px; }
    .detail-value { font-size: 13px; color: var(--text); text-align: right; }
    .detail-value.mono { font-family: var(--font-mono, monospace); }
    .assigned-user { display: flex; gap: 12px; align-items: center; padding: 16px; border-bottom: 1px solid var(--border); }
    .avatar-lg {
      width: 42px; height: 42px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent2), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 600; color: #fff; flex-shrink: 0;
    }
    .unassigned-msg { padding: 24px 16px; text-align: center; color: var(--text2); font-size: 13px; }
    .unassigned-icon { font-size: 28px; color: var(--text3); margin-bottom: 8px; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class AssetDetailComponent implements OnInit {
  id = input.required<string>();

  router = inject(Router);
  auth = inject(AuthService);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  asset = signal<Asset | null>(null);
  loading = signal(true);
  submitting = signal(false);
  showEditModal = signal(false);
  showAssignModal = signal(false);
  
  users = signal<User[]>([]);
  userSearch = '';
  editForm!: FormGroup;

  categories: AssetCategory[] = ['LAPTOP', 'DESKTOP', 'MONITOR', 'MOBILE', 'TABLET', 'PERIPHERAL', 'LICENSE', 'NETWORKING', 'SERVER', 'OTHER'];

  ngOnInit() {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      manufacturer: [''], model: [''], serialNumber: [''],
      location: [''], purchaseDate: [''], purchaseCost: [null],
      refreshDate: [''], warrantyExpiry: [''], notes: ['']
    });
    this.loadAsset();
  }

  loadAsset() {
    this.api.getAsset(this.id()).subscribe(a => {
      this.asset.set(a);
      this.loading.set(false);
    });
  }

  returnAsset() {
    if (confirm('Return this asset?')) {
      this.api.returnAsset(this.id()).subscribe(a => this.asset.set(a));
    }
  }

  openEditModal() {
    const a = this.asset();
    if (!a) return;
    this.editForm.patchValue({
      name: a.name, category: a.category,
      manufacturer: a.manufacturer, model: a.model,
      serialNumber: a.serialNumber, location: a.location,
      purchaseDate: a.purchaseDate, purchaseCost: a.purchaseCost,
      refreshDate: a.refreshDate, warrantyExpiry: a.warrantyExpiry,
      notes: a.notes || a.description
    });
    this.showEditModal.set(true);
  }

  closeEditModal() { this.showEditModal.set(false); }

  submitEdit() {
    if (this.editForm.invalid) return;
    this.submitting.set(true);
    this.api.updateAsset(this.id(), this.editForm.value).subscribe({
      next: (a) => {
        this.asset.set(a);
        this.closeEditModal();
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false)
    });
  }

  openAssignModal() {
    this.userSearch = '';
    this.loadUsersForAssign();
    this.showAssignModal.set(true);
  }

  closeAssignModal() {
    this.showAssignModal.set(false);
    this.users.set([]);
  }

  loadUsersForAssign() {
    this.api.getUsers({ search: this.userSearch || undefined, page: 0, size: 5 })
      .subscribe(r => this.users.set(r.content));
  }

  confirmAssign(user: User) {
    if (confirm(`Assign to ${user.name}?`)) {
      this.api.assignAsset(this.id(), user.id).subscribe({
        next: (a) => {
          this.asset.set(a);
          this.closeAssignModal();
        }
      });
    }
  }

  isNearEol(): boolean {
    const rd = this.asset()?.refreshDate;
    if (!rd) return false;
    const diff = new Date(rd).getTime() - Date.now();
    return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000;
  }

  initials(name: string): string {
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
