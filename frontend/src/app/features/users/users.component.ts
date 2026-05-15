import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Asset, Role } from '../../shared/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-sub">{{ total() }} employees registered</p>
      </div>
      <button class="btn btn-primary" *ngIf="auth.isSuperAdmin()" (click)="openAddUserModal()">+ Add User</button>
    </div>

    <div class="filters-bar">
      <div class="search-field">
        <span>⌕</span>
        <input type="text" placeholder="Search name, email, department…"
               [(ngModel)]="search" (ngModelChange)="onSearch()" />
      </div>
    </div>

    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th><th>Department</th><th>Role</th>
              <th>Assets Held</th><th>Status</th><th>Joined</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users()">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="avatar-sm">{{ initials(user.name) }}</div>
                  <div>
                    <div class="asset-name">{{ user.name }}</div>
                    <div class="asset-id">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td>{{ user.department || '—' }}</td>
              <td>
                <span class="chip" [ngClass]="user.role.toLowerCase().replace('_', '-')">
                  {{ user.role | titlecase }}
                </span>
              </td>
              <td>{{ user.assignedAssetCount }}</td>
              <td>
                <span class="chip" [ngClass]="user.enabled ? 'available' : 'retired'">
                  {{ user.enabled ? 'Active' : 'Disabled' }}
                </span>
              </td>
              <td class="text-muted">{{ user.createdAt | date:'mediumDate' }}</td>
              <td><button class="action-btn" (click)="openProfileModal(user)">Profile</button></td>
            </tr>
            <tr *ngIf="!users().length && !loading()">
              <td colspan="7" class="empty-row">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-cards">
        <div class="m-card" *ngFor="let user of users()" (click)="openProfileModal(user)">
          <div class="m-card-top">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar-sm">{{ initials(user.name) }}</div>
              <div>
                <div class="asset-name">{{ user.name }}</div>
                <div class="asset-id">{{ user.department || '—' }}</div>
              </div>
            </div>
            <span class="chip" [ngClass]="user.enabled ? 'available' : 'retired'">
              {{ user.enabled ? 'Active' : 'Disabled' }}
            </span>
          </div>
          <div class="m-card-row">
            <span class="chip" [ngClass]="user.role.toLowerCase()">{{ user.role }}</span>
            <span class="text-muted">{{ user.assignedAssetCount }} assets</span>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="totalPages() > 1">
        <button class="page-btn" (click)="changePage(currentPage() - 1)" [disabled]="currentPage() === 0">‹</button>
        <span class="page-info">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
        <button class="page-btn" (click)="changePage(currentPage() + 1)"
                [disabled]="currentPage() >= totalPages() - 1">›</button>
      </div>
    </div>

    <!-- Add User Modal -->
    <div class="modal-backdrop" *ngIf="showAddUserModal()" (click)="closeAddUserModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Add New User</h2>
          <button class="modal-close" (click)="closeAddUserModal()">✕</button>
        </div>
        <form [formGroup]="userForm" (ngSubmit)="submitUser()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Employee ID *</label>
              <input formControlName="employeeId" placeholder="EMP123" />
            </div>
            <div class="form-group">
              <label>Full Name *</label>
              <input formControlName="name" placeholder="John Doe" />
            </div>
            <div class="form-group">
              <label>Email Address *</label>
              <input type="email" formControlName="email" placeholder="john.doe@company.com" />
            </div>
            <div class="form-group">
              <label>Password *</label>
              <input type="password" formControlName="password" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label>Department</label>
              <input formControlName="department" placeholder="Engineering" />
            </div>
            <div class="form-group">
              <label>Job Title</label>
              <input formControlName="jobTitle" placeholder="Software Engineer" />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select formControlName="role">
                <option value="EMPLOYEE">Employee</option>
                <option value="IT_ADMIN">IT Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input formControlName="phoneNumber" placeholder="+91..." />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" (click)="closeAddUserModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid || submitting()">
              {{ submitting() ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- User Profile Modal -->
    <div class="modal-backdrop" *ngIf="showProfileModal()" (click)="closeProfileModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">User Profile</h2>
          <button class="modal-close" (click)="closeProfileModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedUser() as user">
          <div class="profile-header">
            <div class="avatar-lg">{{ initials(user.name) }}</div>
            <div class="profile-info">
              <h3>{{ user.name }}</h3>
              <p>{{ user.jobTitle || 'No Title' }} · {{ user.department || 'No Department' }}</p>
              <div class="profile-chips">
                <span class="chip" [ngClass]="user.role.toLowerCase().replace('_', '-')">{{ user.role }}</span>
                <span class="chip" [ngClass]="user.enabled ? 'available' : 'retired'">{{ user.enabled ? 'Active' : 'Disabled' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-grid-mini" style="margin-top: 24px">
            <div class="detail-section">
              <label>Employee ID</label>
              <div class="val">{{ user.employeeId }}</div>
            </div>
            <div class="detail-section">
              <label>Email</label>
              <div class="val">{{ user.email }}</div>
            </div>
            <div class="detail-section">
              <label>Joined On</label>
              <div class="val">{{ user.createdAt | date:'longDate' }}</div>
            </div>
            <div class="detail-section" *ngIf="user.phoneNumber">
              <label>Phone</label>
              <div class="val">{{ user.phoneNumber }}</div>
            </div>
          </div>

          <div class="profile-assets" style="margin-top: 24px">
            <h4 class="section-title">Assigned Assets ({{ user.assignedAssetCount }})</h4>
            <div class="asset-list-mini" *ngIf="userAssets().length; else noAssets">
              <div class="user-item-mini" *ngFor="let asset of userAssets()">
                <div class="avatar-sm" style="background: var(--surface2); color: var(--text)">{{ asset.category[0] }}</div>
                <div class="user-info-mini">
                  <div class="u-name">{{ asset.name }}</div>
                  <div class="u-email">{{ asset.assetTag }} · {{ asset.status }}</div>
                </div>
              </div>
            </div>
            <ng-template #noAssets>
              <p class="empty-msg">No assets currently assigned.</p>
            </ng-template>
          </div>
        </div>
        <div class="modal-footer">
          <div style="flex:1; display:flex; gap:8px; align-items:center;" *ngIf="auth.isSuperAdmin() && selectedUser()?.role !== 'SUPER_ADMIN'">
            <button class="btn btn-ghost" (click)="toggleUserStatus(selectedUser()!)">
              {{ selectedUser()!.enabled ? 'Disable Account' : 'Enable Account' }}
            </button>
            <select class="form-select-mini" (change)="updateUserRole(selectedUser()!, $event)">
              <option value="" disabled selected>Change Role</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="IT_ADMIN">IT Admin</option>
            </select>
          </div>
          <button class="btn btn-primary" (click)="closeProfileModal()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .avatar-sm {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent2), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 600; color: #fff; flex-shrink: 0;
    }
    .profile-header { display: flex; gap: 20px; align-items: center; }
    .avatar-lg {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent2), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 600; color: #fff; flex-shrink: 0;
    }
    .profile-info h3 { margin: 0 0 4px; font-size: 18px; }
    .profile-info p { margin: 0 0 8px; color: var(--text2); font-size: 14px; }
    .profile-chips { display: flex; gap: 8px; }
    .section-title { font-size: 14px; color: var(--text2); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    .empty-msg { color: var(--text3); font-size: 13px; font-style: italic; }
    .form-select-mini {
      background: var(--surface2); border: 1px solid var(--border);
      color: var(--text); padding: 6px 12px; border-radius: 6px; font-size: 13px;
      cursor: pointer; outline: none;
    }
    .form-select-mini:hover { border-color: var(--accent); }
  `]
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  loading = signal(true);
  submitting = signal(false);
  search = '';
  currentPage = signal(0);
  total = signal(0);
  totalPages = signal(1);

  showAddUserModal = signal(false);
  showProfileModal = signal(false);
  selectedUser = signal<User | null>(null);
  userAssets = signal<Asset[]>([]);

  userForm!: FormGroup;

  ngOnInit() {
    this.userForm = this.fb.group({
      employeeId: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      department: [''],
      jobTitle: [''],
      role: ['EMPLOYEE', Validators.required],
      phoneNumber: ['']
    });
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.api.getUsers({ search: this.search || undefined, page: this.currentPage(), size: 20 })
      .subscribe({
        next: r => {
          this.users.set(r.content);
          this.total.set(r.totalElements);
          this.totalPages.set(r.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onSearch() { this.currentPage.set(0); this.loadUsers(); }
  changePage(p: number) { this.currentPage.set(p); this.loadUsers(); }
  initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  openAddUserModal() { this.showAddUserModal.set(true); }
  closeAddUserModal() { this.showAddUserModal.set(false); this.userForm.reset({ role: 'EMPLOYEE' }); }

  submitUser() {
    if (this.userForm.invalid) return;
    this.submitting.set(true);
    this.api.register(this.userForm.value).subscribe({
      next: () => {
        this.closeAddUserModal();
        this.loadUsers();
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false)
    });
  }

  openProfileModal(user: User) {
    this.selectedUser.set(user);
    this.loadUserAssets(user.id);
    this.showProfileModal.set(true);
  }

  closeProfileModal() {
    this.showProfileModal.set(false);
    this.selectedUser.set(null);
    this.userAssets.set([]);
  }

  loadUserAssets(userId: string) {
    this.api.getUserAssets(userId)
      .subscribe(assets => {
        this.userAssets.set(assets);
      });
  }

  toggleUserStatus(user: User) {
    if (confirm(`Are you sure you want to ${user.enabled ? 'disable' : 'enable'} this user?`)) {
      this.api.updateUserStatus(user.id, !user.enabled).subscribe(() => {
        this.loadUsers();
        this.closeProfileModal();
      });
    }
  }

  updateUserRole(user: User, event: any) {
    const role = event.target.value as Role;
    if (confirm(`Change ${user.name}'s role to ${role}?`)) {
      this.api.updateUserRole(user.id, role).subscribe(() => {
        this.loadUsers();
        this.closeProfileModal();
      });
    }
  }
}
