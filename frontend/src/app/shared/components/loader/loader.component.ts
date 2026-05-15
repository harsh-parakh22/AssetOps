import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" *ngIf="loader.isLoading()">
      <div class="loader-spinner">
        <div class="emoji-container">
          <div class="emoji-wrapper"><span class="emoji e1">💻</span></div>
          <div class="emoji-wrapper"><span class="emoji e2">📱</span></div>
          <div class="emoji-wrapper"><span class="emoji e3">📞</span></div>
          <div class="emoji-wrapper"><span class="emoji e4">🗄️</span></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 15, 25, 0.7);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .loader-spinner {
      width: 80px;
      height: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--surface);
      border-radius: 50%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      border: 1px solid var(--border);
    }
    .emoji-container {
      position: relative;
      width: 40px;
      height: 40px;
      animation: spin 2s linear infinite;
    }
    .emoji-wrapper {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      animation: counter-spin 2s linear infinite;
    }
    .emoji {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%; height: 100%;
      font-size: 32px;
      opacity: 0;
      animation: fade 2s ease-in-out infinite;
    }
    .e1 { animation-delay: 0s; }
    .e2 { animation-delay: 0.5s; }
    .e3 { animation-delay: 1.0s; }
    .e4 { animation-delay: 1.5s; }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
    @keyframes counter-spin {
      100% { transform: rotate(-360deg); }
    }
    @keyframes fade {
      0%, 100% { opacity: 0; transform: scale(0.5); }
      10%, 25% { opacity: 1; transform: scale(1); }
      35%, 100% { opacity: 0; transform: scale(0.5); }
    }
  `]
})
export class LoaderComponent {
  loader = inject(LoaderService);
}
