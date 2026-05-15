import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AppNotification as Notification } from '../../shared/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Notifications</h1>
        <p class="page-sub">{{ unread() }} unread</p>
      </div>
      <button class="btn btn-ghost" (click)="markAllRead()" *ngIf="unread() > 0">
        Mark all read
      </button>
    </div>

    <div class="panel">
      <div class="notif-list">
        <div class="notif-item" *ngFor="let n of notifications()"
             [class.unread]="!n.isRead" (click)="markRead(n)">
          <div class="notif-dot" [style.background]="typeColor(n.type)"></div>
          <div class="notif-body">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-message">{{ n.message }}</div>
            <div class="notif-time">{{ n.createdAt | date:'medium' }}</div>
          </div>
          <div class="unread-indicator" *ngIf="!n.isRead"></div>
        </div>
        <div class="empty-row" *ngIf="!notifications().length">
          No notifications yet — you're all caught up! 🎉
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-list { display: flex; flex-direction: column; }
    .notif-item {
      display: flex; gap: 12px; padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      cursor: pointer; transition: background .12s;
      align-items: flex-start; position: relative;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--surface2); }
      &.unread { background: rgba(79,158,255,.04); }
    }
    .notif-dot {
      width: 8px; height: 8px; border-radius: 50%;
      flex-shrink: 0; margin-top: 5px;
    }
    .notif-body { flex: 1; min-width: 0; }
    .notif-title { font-size: 13px; font-weight: 500; color: var(--text); }
    .notif-message { font-size: 12px; color: var(--text2); margin-top: 2px; line-height: 1.4; }
    .notif-time { font-size: 10px; color: var(--text3); font-family: var(--font-mono, monospace); margin-top: 4px; }
    .unread-indicator {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--accent); flex-shrink: 0; margin-top: 6px;
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private ws = inject(WebSocketService);
  notifications = signal<Notification[]>([]);
  unread = signal(0);
  private sub?: Subscription;

  ngOnInit() {
    this.loadNotifications();
    this.sub = this.ws.notifications$.subscribe(n => {
      this.notifications.update(list => [n, ...list]);
      this.unread.update(c => c + 1);
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  loadNotifications() {
    this.api.getNotifications(0, 50).subscribe(r => {
      this.notifications.set(r.content);
      this.unread.set(r.content.filter((n: Notification) => !n.isRead).length);
    });
  }

  markRead(n: Notification) {
    if (!n.isRead) {
      n.isRead = true;
      this.unread.update(c => Math.max(0, c - 1));
      this.ws.decrementUnread();
    }
  }

  markAllRead() {
    this.api.markAllRead().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      this.unread.set(0);
      this.ws.clearUnread();
    });
  }

  typeColor(type: string): string {
    const m: Record<string, string> = {
      REQUEST_APPROVED: 'var(--green)',   REQUEST_REJECTED: 'var(--red)',
      REQUEST_SUBMITTED: 'var(--accent2)', ASSET_ASSIGNED: 'var(--accent)',
      EOL_WARNING: 'var(--amber)',         LICENSE_EXPIRY: 'var(--amber)',
    };
    return m[type] || 'var(--text3)';
  }
}
