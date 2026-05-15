import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { AuthService } from './auth.service';
import { AppNotification as Notification } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private auth = inject(AuthService);

  private client: Client | null = null;
  private _notifications = new Subject<Notification>();
  private _unreadCount = new BehaviorSubject<number>(0);

  notifications$ = this._notifications.asObservable();
  unreadCount$ = this._unreadCount.asObservable();

  connect(): void {
    const token = this.auth.getAccessToken();
    if (!token || this.client?.active) return;

    this.client = new Client({
      brokerURL: environment.wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.subscribeToUserNotifications();
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error', frame.headers['message']);
    };

    this.client.activate();
  }

  private subscribeToUserNotifications(): void {
    if (!this.client?.connected) return;

    const userId = this.auth.currentUserSignal()?.id;
    if (!userId) {
      // If user isn't available yet, wait a bit and retry
      setTimeout(() => this.subscribeToUserNotifications(), 1000);
      return;
    }

    this.client.subscribe(`/user/${userId}/queue/notifications`, (msg: IMessage) => {
      try {
        const notification: Notification = JSON.parse(msg.body);
        this._notifications.next(notification);
        this._unreadCount.next(this._unreadCount.value + 1);
      } catch (e) {
        console.error('Failed to parse notification', e);
      }
    });

    this.client.subscribe('/topic/broadcast', (msg: IMessage) => {
      try {
        const notification: Notification = JSON.parse(msg.body);
        this._notifications.next(notification);
      } catch (e) {
        console.error('Failed to parse broadcast', e);
      }
    });
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
  }

  setUnreadCount(count: number): void {
    this._unreadCount.next(count);
  }

  decrementUnread(): void {
    const current = this._unreadCount.value;
    if (current > 0) this._unreadCount.next(current - 1);
  }

  clearUnread(): void {
    this._unreadCount.next(0);
  }
}
