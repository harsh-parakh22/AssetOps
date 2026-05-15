import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="forbidden-shell">
      <div class="forbidden-card">
        <div class="forbidden-code">403</div>
        <h1 class="forbidden-title">Access Denied</h1>
        <p class="forbidden-message">
          You don't have permission to view this page.
          Contact your IT administrator if you believe this is an error.
        </p>
        <a class="btn btn-primary" routerLink="/">← Back to Home</a>
      </div>
    </div>
  `,
  styles: [`
    .forbidden-shell {
      min-height: 100vh; background: var(--bg);
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .forbidden-card {
      text-align: center; max-width: 400px;
    }
    .forbidden-code {
      font-size: 80px; font-weight: 600;
      font-family: 'IBM Plex Mono', monospace;
      color: var(--red); opacity: .6; line-height: 1;
      margin-bottom: 16px;
    }
    .forbidden-title { font-size: 24px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
    .forbidden-message { font-size: 14px; color: var(--text2); line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-flex; align-items: center; padding: 10px 20px;
           border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none; }
    .btn-primary { background: var(--accent); color: #fff; }
  `]
})
export class ForbiddenComponent {}
