import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div *ngFor="let toast of toastService.toasts()" 
           class="toast-item" 
           [ngClass]="toast.type">
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'warning'">⚠</span>
          <span *ngIf="toast.type === 'info'">ℹ</span>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button *ngIf="toast.actionText" class="toast-action-btn" (click)="toast.onAction?.(); toastService.dismiss(toast.id)">
          {{ toast.actionText }}
        </button>
        <button class="toast-close-btn" (click)="toastService.dismiss(toast.id)" aria-label="Close notification">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: calc(100vw - 32px);
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      background: var(--surface, #1e293b);
      border: 1px solid var(--border, #334155);
      color: var(--text, #f8fafc);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      backdrop-filter: blur(12px);
    }
    .toast-icon {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.4;
      flex-shrink: 0;
    }
    .toast-item.success .toast-icon { color: #10b981; }
    .toast-item.error .toast-icon { color: #ef4444; }
    .toast-item.warning .toast-icon { color: #f59e0b; }
    .toast-item.info .toast-icon { color: #3b82f6; }

    .toast-item.success { border-left: 4px solid #10b981; }
    .toast-item.error { border-left: 4px solid #ef4444; }
    .toast-item.warning { border-left: 4px solid #f59e0b; }
    .toast-item.info { border-left: 4px solid #3b82f6; }

    .toast-content {
      flex: 1;
      min-width: 0;
    }
    .toast-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .toast-message {
      font-size: 12px;
      color: var(--text2, #94a3b8);
      line-height: 1.4;
      word-break: break-word;
    }
    .toast-action-btn {
      background: transparent;
      border: none;
      color: var(--accent, #6366f1);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 2px 6px;
      text-decoration: underline;
    }
    .toast-close-btn {
      background: transparent;
      border: none;
      color: var(--text3, #64748b);
      cursor: pointer;
      font-size: 14px;
      padding: 0 4px;
      line-height: 1;
    }
    .toast-close-btn:hover {
      color: var(--text, #f8fafc);
    }
    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
