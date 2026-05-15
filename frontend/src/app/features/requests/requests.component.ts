import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AssetRequest, RequestStatus, Priority, Asset } from '../../shared/models';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Asset Requests</h1>
        <p class="page-sub">{{ pendingCount() }} pending approval</p>
      </div>
      <button class="btn btn-primary" (click)="openSubmitModal()">+ New Request</button>
    </div>

    <!-- Status filter tabs -->
    <div class="tab-bar">
      <button class="tab" *ngFor="let tab of tabs"
              [class.active]="activeTab() === tab.value"
              (click)="setTab(tab.value)">
        {{ tab.label }}
        <span class="tab-badge" *ngIf="tab.value === 'PENDING' && pendingCount() > 0">
          {{ pendingCount() }}
        </span>
      </button>
    </div>

    <!-- Desktop table -->
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Request</th><th>Employee</th><th>Asset Requested</th>
              <th>Priority</th><th>Status</th><th>Submitted</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let req of requests()">
              <td><span class="asset-id">{{ req.requestNumber }}</span></td>
              <td>
                <div class="asset-name">{{ req.requestedByName }}</div>
                <div class="asset-id">{{ req.requestedByEmail }}</div>
              </td>
              <td>{{ req.assetName || req.requestedAssetType || '—' }}</td>
              <td><span class="chip" [ngClass]="req.priority.toLowerCase()">{{ req.priority }}</span></td>
              <td><span class="chip" [ngClass]="req.status.toLowerCase()">{{ req.status }}</span></td>
              <td class="text-muted">{{ req.createdAt | date:'mediumDate' }}</td>
              <td>
                <div class="row-actions">
                  <ng-container *ngIf="auth.isAdmin() && req.status === 'PENDING'">
                    <button class="action-btn approve" (click)="openReviewModal(req, 'approve')">Approve</button>
                    <button class="action-btn reject" (click)="openReviewModal(req, 'reject')">Reject</button>
                  </ng-container>
                  <button class="action-btn" *ngIf="auth.isAdmin() && req.status === 'APPROVED'"
                          (click)="openAllocateModal(req)">Allocate</button>
                  <button class="action-btn" (click)="viewDetail(req)">View</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!requests().length && !loading()">
              <td colspan="7" class="empty-row">No requests found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="mobile-cards">
        <div class="m-card" *ngFor="let req of requests()">
          <div class="m-card-top">
            <div>
              <div class="asset-name">{{ req.assetName || req.requestedAssetType }}</div>
              <div class="asset-id">{{ req.requestNumber }} · {{ req.requestedByName }}</div>
            </div>
            <span class="chip" [ngClass]="req.status.toLowerCase()">{{ req.status }}</span>
          </div>
          <div class="m-card-row">
            <span class="chip" [ngClass]="req.priority.toLowerCase()">{{ req.priority }}</span>
            <span class="text-muted">{{ req.createdAt | date:'mediumDate' }}</span>
          </div>
          <div class="m-actions">
            <button class="action-btn" (click)="viewDetail(req)">View Detail</button>
            <ng-container *ngIf="auth.isAdmin() && req.status === 'PENDING'">
              <button class="action-btn approve" (click)="openReviewModal(req, 'approve')">Approve</button>
              <button class="action-btn reject" (click)="openReviewModal(req, 'reject')">Reject</button>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages() > 1">
        <button class="page-btn" (click)="changePage(currentPage() - 1)" [disabled]="currentPage() === 0">‹</button>
        <span class="page-info">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
        <button class="page-btn" (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1">›</button>
      </div>
    </div>

    <!-- Submit Request Modal -->
    <div class="modal-backdrop" *ngIf="showSubmitModal()" (click)="closeSubmitModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Submit Asset Request</h2>
          <button class="modal-close" (click)="closeSubmitModal()">✕</button>
        </div>
        <form [formGroup]="submitForm" (ngSubmit)="submitRequest()" class="modal-body">
          <div class="form-group">
            <label>Asset Type / Description *</label>
            <input formControlName="requestedAssetType" placeholder="MacBook Pro M3, Dell Monitor 27&quot;…" />
          </div>
          <div class="form-group">
            <label>Reason *</label>
            <textarea formControlName="reason" rows="3" placeholder="Describe why you need this asset…"></textarea>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select formControlName="priority">
              <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" (click)="closeSubmitModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="submitForm.invalid || submitting()">
              {{ submitting() ? 'Submitting…' : 'Submit Request' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Review Modal (approve/reject) -->
    <div class="modal-backdrop" *ngIf="showReviewModal()" (click)="closeReviewModal()">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title" [class.text-green]="reviewAction() === 'approve'"
              [class.text-red]="reviewAction() === 'reject'">
            {{ reviewAction() === 'approve' ? '✓ Approve Request' : '✕ Reject Request' }}
          </h2>
          <button class="modal-close" (click)="closeReviewModal()">✕</button>
        </div>
        <form [formGroup]="reviewForm" (ngSubmit)="submitReview()" class="modal-body">
          <p class="review-info">
            <strong>{{ reviewingRequest()?.requestedByName }}</strong> requested:
            {{ reviewingRequest()?.assetName || reviewingRequest()?.requestedAssetType }}
          </p>
          <div class="form-group">
            <label>Notes {{ reviewAction() === 'reject' ? '*' : '(optional)' }}</label>
            <textarea formControlName="notes" rows="3"
                      [placeholder]="reviewAction() === 'reject' ? 'Reason for rejection…' : 'Any notes for the employee…'">
            </textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" (click)="closeReviewModal()">Cancel</button>
            <button type="submit" class="btn"
                    [class.btn-primary]="reviewAction() === 'approve'"
                    [class.btn-danger]="reviewAction() === 'reject'"
                    [disabled]="submitting()">
              {{ submitting() ? 'Processing…' : (reviewAction() === 'approve' ? 'Confirm Approve' : 'Confirm Reject') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Allocate Modal -->
    <div class="modal-backdrop" *ngIf="showAllocateModal()" (click)="closeAllocateModal()">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Allocate Asset</h2>
          <button class="modal-close" (click)="closeAllocateModal()">✕</button>
        </div>
        <div class="modal-body">
          <p class="review-info">Allocating for <strong>{{ allocatingRequest()?.requestedByName }}</strong></p>
          <div class="form-group">
            <label>Search Available Assets</label>
            <div class="search-field">
              <span>⌕</span>
              <input type="text" placeholder="Asset name or tag..." [(ngModel)]="assetSearch" (ngModelChange)="loadAssetsForAllocate()" />
            </div>
          </div>
          <div class="user-list-mini" *ngIf="availableAssets().length; else noAssets">
            <div class="user-item-mini" *ngFor="let asset of availableAssets()" (click)="confirmAllocate(asset)">
              <div class="avatar-sm" style="background: var(--surface2); color: var(--text)">{{ asset.category[0] }}</div>
              <div class="user-info-mini">
                <div class="u-name">{{ asset.name }}</div>
                <div class="u-email">{{ asset.assetTag }} · {{ asset.location }}</div>
              </div>
              <span class="assign-hint">Allocate</span>
            </div>
          </div>
          <ng-template #noAssets>
            <div class="empty-row" style="padding: 20px 0">No available assets found</div>
          </ng-template>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" (click)="closeAllocateModal()">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Request Detail Modal -->
    <div class="modal-backdrop" *ngIf="showDetailModal()" (click)="closeDetailModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Request Details</h2>
          <button class="modal-close" (click)="closeDetailModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedRequest() as req">
          <div class="detail-header-mini">
            <div class="req-num">{{ req.requestNumber }}</div>
            <span class="chip" [ngClass]="req.status.toLowerCase()">{{ req.status }}</span>
          </div>
          <div class="detail-grid-mini">
            <div class="detail-section">
              <label>Requested Asset</label>
              <div class="val">{{ req.assetName || req.requestedAssetType }}</div>
            </div>
            <div class="detail-section">
              <label>Requested By</label>
              <div class="val">{{ req.requestedByName }}</div>
              <div class="sub-val">{{ req.requestedByEmail }}</div>
            </div>
            <div class="detail-section full">
              <label>Reason</label>
              <div class="val text-block">{{ req.reason }}</div>
            </div>
            <div class="detail-section">
              <label>Priority</label>
              <div class="val"><span class="chip" [ngClass]="req.priority.toLowerCase()">{{ req.priority }}</span></div>
            </div>
            <div class="detail-section">
              <label>Submitted On</label>
              <div class="val">{{ req.createdAt | date:'medium' }}</div>
            </div>
            <div class="detail-section" *ngIf="req.reviewedByName">
              <label>Reviewed By</label>
              <div class="val">{{ req.reviewedByName }}</div>
              <div class="sub-val">{{ req.reviewedAt | date:'medium' }}</div>
            </div>
            <div class="detail-section full" *ngIf="req.reviewerNotes">
              <label>Reviewer Notes</label>
              <div class="val text-block">{{ req.reviewerNotes }}</div>
            </div>
            <div class="detail-section" *ngIf="req.assetTag">
              <label>Allocated Asset</label>
              <div class="val">{{ req.assetTag }}</div>
              <div class="sub-val" *ngIf="req.allocatedAt">Allocated on {{ req.allocatedAt | date:'medium' }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" (click)="closeDetailModal()">Close</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './requests.component.scss'
})
export class RequestsComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  requests = signal<AssetRequest[]>([]);
  loading = signal(true);
  submitting = signal(false);
  activeTab = signal<RequestStatus | ''>('PENDING');
  pendingCount = signal(0);
  currentPage = signal(0);
  totalPages = signal(1);

  showSubmitModal = signal(false);
  showReviewModal = signal(false);
  reviewAction = signal<'approve' | 'reject'>('approve');
  reviewingRequest = signal<AssetRequest | null>(null);

  // Allocate & Detail features
  showAllocateModal = signal(false);
  showDetailModal = signal(false);
  selectedRequest = signal<AssetRequest | null>(null);
  allocatingRequest = signal<AssetRequest | null>(null);
  availableAssets = signal<Asset[]>([]);
  assetSearch = '';

  submitForm!: FormGroup;
  reviewForm!: FormGroup;

  priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  tabs = [
    { label: 'Pending', value: 'PENDING' as RequestStatus },
    { label: 'Approved', value: 'APPROVED' as RequestStatus },
    { label: 'Rejected', value: 'REJECTED' as RequestStatus },
    { label: 'All', value: '' as any }
  ];

  ngOnInit(): void {
    this.submitForm = this.fb.group({
      requestedAssetType: ['', Validators.required],
      reason: ['', Validators.required],
      priority: ['MEDIUM']
    });
    this.reviewForm = this.fb.group({ notes: [''] });
    this.loadRequests();
    this.loadPendingCount();
  }

  loadRequests(): void {
    this.loading.set(true);
    const userId = this.auth.currentUserSignal()?.id;
    const isAdmin = this.auth.isAdmin();

    this.api.getRequests({
      status: this.activeTab() || undefined,
      userId: !isAdmin ? userId : undefined,
      page: this.currentPage(),
      size: 20
    }).subscribe({
      next: r => {
        this.requests.set(r.content);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadPendingCount(): void {
    this.api.getRequests({ status: 'PENDING', page: 0, size: 1 })
      .subscribe(r => this.pendingCount.set(r.totalElements));
  }

  setTab(status: RequestStatus | ''): void {
    this.activeTab.set(status);
    this.currentPage.set(0);
    this.loadRequests();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadRequests();
  }

  openSubmitModal(): void { this.showSubmitModal.set(true); }
  closeSubmitModal(): void { this.showSubmitModal.set(false); this.submitForm.reset({ priority: 'MEDIUM' }); }

  submitRequest(): void {
    if (this.submitForm.invalid) return;
    this.submitting.set(true);
    this.api.submitRequest(this.submitForm.value).subscribe({
      next: () => { this.closeSubmitModal(); this.loadRequests(); this.loadPendingCount(); this.submitting.set(false); },
      error: () => this.submitting.set(false)
    });
  }

  openReviewModal(req: AssetRequest, action: 'approve' | 'reject'): void {
    this.reviewingRequest.set(req);
    this.reviewAction.set(action);
    this.reviewForm.reset();
    this.showReviewModal.set(true);
  }
  closeReviewModal(): void { this.showReviewModal.set(false); this.reviewingRequest.set(null); }

  submitReview(): void {
    const req = this.reviewingRequest();
    if (!req) return;
    this.submitting.set(true);
    const obs = this.reviewAction() === 'approve'
      ? this.api.approveRequest(req.id, this.reviewForm.value)
      : this.api.rejectRequest(req.id, this.reviewForm.value);

    obs.subscribe({
      next: () => { this.closeReviewModal(); this.loadRequests(); this.loadPendingCount(); this.submitting.set(false); },
      error: () => this.submitting.set(false)
    });
  }

  openAllocateModal(req: AssetRequest): void {
    this.allocatingRequest.set(req);
    this.assetSearch = '';
    this.loadAssetsForAllocate();
    this.showAllocateModal.set(true);
  }

  closeAllocateModal(): void {
    this.showAllocateModal.set(false);
    this.allocatingRequest.set(null);
    this.availableAssets.set([]);
  }

  loadAssetsForAllocate(): void {
    this.api.getAssets({
      search: this.assetSearch || undefined,
      status: 'AVAILABLE',
      page: 0,
      size: 5
    }).subscribe(r => this.availableAssets.set(r.content));
  }

  confirmAllocate(asset: Asset): void {
    const req = this.allocatingRequest();
    if (!req) return;

    if (confirm(`Allocate ${asset.name} (${asset.assetTag}) to this request?`)) {
      this.api.allocateRequest(req.id, asset.id).subscribe({
        next: () => {
          this.closeAllocateModal();
          this.loadRequests();
        }
      });
    }
  }

  viewDetail(req: AssetRequest): void {
    this.selectedRequest.set(req);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedRequest.set(null);
  }
}
