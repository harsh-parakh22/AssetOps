import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../../shared/models';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const roleGuard = (...roles: Role[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (auth.hasAnyRole(...roles)) return true;

    router.navigate(['/forbidden']);
    return false;
  };
};

export const adminGuard: CanActivateFn = roleGuard('IT_ADMIN', 'SUPER_ADMIN');
export const superAdminGuard: CanActivateFn = roleGuard('SUPER_ADMIN');
