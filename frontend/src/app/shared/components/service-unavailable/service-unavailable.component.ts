import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-service-unavailable',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="error-shell">
      <div class="error-card">
        <div class="status-badge alert">503 System Notice</div>
        <div class="error-code">503</div>
        <h1 class="error-title">Service Temporarily Unavailable</h1>
        <p class="error-message">
          The AssetOps core platform or background cluster is currently provisioning,
          undergoing routine maintenance, or experiencing brief connectivity interruption.
          Our automated health checks are polling the cluster.
        </p>
        <div class="error-actions">
          <button class="btn btn-primary" (click)="retry()">Retry Connection</button>
          <a class="btn btn-outline" routerLink="/dashboard">Return to Dashboard</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-shell {
      min-height: 100vh;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .error-card {
      text-align: center;
      max-width: 480px;
      padding: 40px 32px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-radius: 999px;
      margin-bottom: 16px;
    }
    .status-badge.alert {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.14);
    }
    .error-code {
      font-size: 84px;
      font-weight: 700;
      font-family: 'IBM Plex Mono', monospace;
      color: #f59e0b;
      line-height: 1;
      margin-bottom: 16px;
      letter-spacing: -2px;
    }
    .error-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .error-message {
      font-size: 14px;
      color: var(--text2);
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .error-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.18s ease;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: var(--accent);
      color: #ffffff;
      border: 1px solid var(--accent);
    }
    .btn-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .btn-outline {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: var(--text2);
    }
  `]
})
export class ServiceUnavailableComponent {
  retry(): void {
    window.location.reload();
  }
}
