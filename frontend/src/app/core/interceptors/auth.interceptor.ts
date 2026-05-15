import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getAccessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Backend is down or unreachable — normalize the error
      if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
        const normalizedErr = new HttpErrorResponse({
          error: {
            status: err.status || 503,
            error: 'Service Unavailable',
            message: 'Server is starting up or unavailable. Please try again in a moment.',
            detail: 'Server is starting up or unavailable. Please try again in a moment.'
          },
          status: err.status || 503,
          statusText: 'Service Unavailable',
          url: err.url ?? undefined
        });
        return throwError(() => normalizedErr);
      }
      if (err.status === 401) {
        auth.logout();
        router.navigate(['/auth/login'], { queryParams: { reason: 'session_expired' } });
      }
      if (err.status === 403) {
        router.navigate(['/forbidden']);
      }
      return throwError(() => err);
    })
  );
};

