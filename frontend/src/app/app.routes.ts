import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { 
        path: '', 
        redirectTo: () => inject(AuthService).isAdmin() ? 'dashboard' : 'requests', 
        pathMatch: 'full' 
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [adminGuard],
        title: 'Dashboard | ItVault'
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
        canActivate: [adminGuard],
        title: 'Inventory | ItVault'
      },
      {
        path: 'inventory/:id',
        loadComponent: () => import('./features/inventory/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent),
        canActivate: [adminGuard],
        title: 'Asset Detail | ItVault'
      },
      {
        path: 'requests',
        loadComponent: () => import('./features/requests/requests.component').then(m => m.RequestsComponent),
        title: 'Requests | ItVault'
      },
      {
        path: 'lifecycle',
        loadComponent: () => import('./features/lifecycle/lifecycle.component').then(m => m.LifecycleComponent),
        canActivate: [adminGuard],
        title: 'Lifecycle | ItVault'
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
        canActivate: [adminGuard],
        title: 'Users | ItVault'
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [adminGuard],
        title: 'Reports | ItVault'
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'Notifications | ItVault'
      }
    ]
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./shared/components/forbidden/forbidden.component').then(m => m.ForbiddenComponent)
  },
  { path: '**', redirectTo: '' }
];
