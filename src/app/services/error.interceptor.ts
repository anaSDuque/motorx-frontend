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
            // Don't show toast for login 401 (handled by component), 2FA flows, or certain harmless endpoints
            const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register') ||
                req.url.includes('/auth/verify') || req.url.includes('/password');

            const quietEndpoints = ['/check-plate-restriction', '/available-slots'];
            const isQuiet = quietEndpoints.some((p) => req.url.includes(p));

            if (!isAuthEndpoint && !isQuiet) {
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
