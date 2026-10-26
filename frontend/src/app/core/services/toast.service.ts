import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  show(toast: Omit<ToastMessage, 'id'>): string {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const duration = toast.duration ?? 4500;
    const newToast: ToastMessage = { ...toast, id };

    this.toasts.update(current => [newToast, ...current.slice(0, 4)]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(message: string, title = 'Success'): string {
    return this.show({ type: 'success', title, message });
  }

  error(message: string, title = 'Error'): string {
    return this.show({ type: 'error', title, message });
  }

  info(message: string, title = 'Information'): string {
    return this.show({ type: 'info', title, message });
  }

  warning(message: string, title = 'Warning'): string {
    return this.show({ type: 'warning', title, message });
  }

  dismiss(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
