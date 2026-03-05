import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notificationService = inject(NotificationService);
    const authService = inject(AuthService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Don't show toast for login 401 (handled by component), or 2FA flows
            const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register') ||
                req.url.includes('/auth/verify') || req.url.includes('/password');

            if (!isAuthEndpoint) {
                const friendlyMessage = notificationService.handleHttpError(error);
                notificationService.error(friendlyMessage);
            }

            // Auto-logout on 401 for non-auth endpoints
            if (error.status === 401 && !isAuthEndpoint) {
                authService.clearSession();
                router.navigate(['/login']);
            }

            return throwError(() => error);
        })
    );
};
