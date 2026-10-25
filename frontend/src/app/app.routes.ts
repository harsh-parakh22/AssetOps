import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    title: 'AssetOps | Next-Gen Enterprise IT Asset Operations & Intelligence'
  },
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
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [adminGuard],
        title: 'Dashboard | AssetOps'
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
        canActivate: [adminGuard],
        title: 'Inventory | AssetOps'
      },
      {
        path: 'inventory/:id',
        loadComponent: () => import('./features/inventory/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent),
        canActivate: [adminGuard],
        title: 'Asset Detail | AssetOps'
      },
      {
        path: 'requests',
        loadComponent: () => import('./features/requests/requests.component').then(m => m.RequestsComponent),
        title: 'Requests | AssetOps'
      },
      {
        path: 'lifecycle',
        loadComponent: () => import('./features/lifecycle/lifecycle.component').then(m => m.LifecycleComponent),
        canActivate: [adminGuard],
        title: 'Lifecycle | AssetOps'
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
        canActivate: [adminGuard],
        title: 'Audit Trail | AssetOps'
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
        canActivate: [adminGuard],
        title: 'Users | AssetOps'
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [adminGuard],
        title: 'Reports | AssetOps'
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'Notifications | AssetOps'
      }
    ]
  },
  {
    path: '503',
    loadComponent: () => import('./shared/components/service-unavailable/service-unavailable.component').then(m => m.ServiceUnavailableComponent),
    title: '503 Service Unavailable | AssetOps'
  },
  {
    path: '404',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 Page Not Found | AssetOps'
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 Page Not Found | AssetOps'
  }
];
