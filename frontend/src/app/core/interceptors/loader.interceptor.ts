import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoaderService } from '../services/loader.service';
import { finalize } from 'rxjs';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  
  // Skip loader for silent requests like WebSocket polling or search suggestions
  if (req.headers.has('X-Skip-Loader')) {
    const newReq = req.clone({ headers: req.headers.delete('X-Skip-Loader') });
    return next(newReq);
  }

  loaderService.show();
  return next(req).pipe(
    finalize(() => loaderService.hide())
  );
};
