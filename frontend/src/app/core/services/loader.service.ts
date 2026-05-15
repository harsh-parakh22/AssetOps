import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private activeRequests = 0;
  isLoading = signal(false);

  show() {
    this.activeRequests++;
    this.isLoading.set(true);
  }

  hide() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) {
      // Small delay to prevent flickering and ensure UI has time to render
      setTimeout(() => {
        if (this.activeRequests === 0) {
          this.isLoading.set(false);
        }
      }, 200);
    }
  }
}
