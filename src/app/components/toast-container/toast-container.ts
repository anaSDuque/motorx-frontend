import { Component, inject } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    template: `
    @for (notification of notificationService.notifications(); track notification.id) {
      <div class="toast-item toast-{{ notification.type }}" role="alert">
        <div class="d-flex align-items-start gap-3">
          <i class="bi toast-icon" [class]="getIcon(notification.type)"></i>
          <div class="flex-grow-1">{{ notification.message }}</div>
          <button class="btn-close btn-close-white ms-2" (click)="notificationService.dismiss(notification.id)"></button>
        </div>
      </div>
    }
  `,
    styles: [`
    :host {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      width: 100%;
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      padding: 16px 20px;
      border-radius: 16px;
      color: #fff;
      font-weight: 500;
      font-size: 0.9rem;
      line-height: 1.5;
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
      animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .toast-error {
      background: linear-gradient(135deg, rgba(217, 48, 37, 0.92), rgba(165, 14, 14, 0.92));
      border-left: 4px solid #ff6b6b;
    }

    .toast-success {
      background: linear-gradient(135deg, rgba(30, 142, 62, 0.92), rgba(21, 100, 44, 0.92));
      border-left: 4px solid #81c995;
    }

    .toast-warning {
      background: linear-gradient(135deg, rgba(249, 171, 0, 0.92), rgba(200, 137, 0, 0.92));
      border-left: 4px solid #fdd663;
      color: #1a1a1a;
    }

    .toast-info {
      background: linear-gradient(135deg, rgba(26, 115, 232, 0.92), rgba(23, 78, 166, 0.92));
      border-left: 4px solid #8ab4f8;
    }

    .toast-icon {
      font-size: 1.25rem;
      margin-top: 2px;
    }

    .btn-close {
      opacity: 0.7;
      font-size: 0.65rem;
      margin-top: 2px;
    }

    .btn-close:hover { opacity: 1; }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(60px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class ToastContainer {
    protected readonly notificationService = inject(NotificationService);

    protected getIcon(type: string): string {
        switch (type) {
            case 'error': return 'bi-x-circle-fill';
            case 'success': return 'bi-check-circle-fill';
            case 'warning': return 'bi-exclamation-triangle-fill';
            case 'info': return 'bi-info-circle-fill';
            default: return 'bi-info-circle-fill';
        }
    }
}
