import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationApiService } from '../../services/notification-api.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationResponseDTO, Role } from '../../models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, DatePipe],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class Layout implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly notificationApiService = inject(NotificationApiService);
  private readonly notificationService = inject(NotificationService);

  protected readonly notifications = signal<NotificationResponseDTO[]>([]);
  protected readonly notificationPanelOpen = signal(false);
  protected readonly notificationsLoading = signal(false);
  protected readonly notificationsError = signal('');
  protected readonly onlyUnread = signal(false);

  protected readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.isRead).length
  );

  ngOnInit(): void {
    this.loadNotifications();
  }

  protected get userName(): string {
    return this.authService.currentUser()?.name ?? this.authService.getStoredUserName() ?? 'Usuario';
  }

  protected get isAdmin(): boolean {
    return this.authService.getStoredRole() === Role.ADMIN;
  }

  protected get isEmployee(): boolean {
    const role = this.authService.getStoredRole();
    return (
      role === Role.RECEPTIONIST ||
      role === Role.WARE_HOUSE_WORKER ||
      role === Role.TECHNICIAN ||
      role === Role.EMPLOYEE
    );
  }

  protected get isWarehouseEmployee(): boolean {
    return this.authService.getStoredRole() === Role.WARE_HOUSE_WORKER;
  }

  protected get isReceptionEmployee(): boolean {
    const role = this.authService.getStoredRole();
    return role === Role.RECEPTIONIST || role === Role.EMPLOYEE;
  }

  protected get isClient(): boolean {
    return !this.isAdmin && !this.isEmployee;
  }

  protected get canAccessStaffModules(): boolean {
    return this.isAdmin || this.isEmployee;
  }

  protected toggleNotificationPanel(): void {
    const willOpen = !this.notificationPanelOpen();
    this.notificationPanelOpen.set(willOpen);
    if (willOpen) {
      this.loadNotifications();
    }
  }

  protected setOnlyUnread(value: boolean): void {
    this.onlyUnread.set(value);
    this.loadNotifications();
  }

  protected loadNotifications(): void {
    this.notificationsLoading.set(true);
    this.notificationsError.set('');

    this.notificationApiService.getMyNotifications(this.onlyUnread()).subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.notificationsLoading.set(false);
      },
      error: (err) => {
        this.notificationsLoading.set(false);
        this.notificationsError.set(
          err.error?.message ?? this.notificationService.handleHttpError(err)
        );
      },
    });
  }

  protected markAsRead(notificationId: number): void {
    this.notificationApiService.markMyNotificationAsRead(notificationId).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => {
        this.notificationsError.set(
          err.error?.message ?? this.notificationService.handleHttpError(err)
        );
      },
    });
  }

  protected markAllAsRead(): void {
    this.notificationApiService.markAllMyNotificationsAsRead().subscribe({
      next: (res) => {
        this.notificationService.success(res.message || 'Notificaciones marcadas como leídas.');
        this.loadNotifications();
      },
      error: (err) => {
        this.notificationsError.set(
          err.error?.message ?? this.notificationService.handleHttpError(err)
        );
      },
    });
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected onLogout(): void {
    this.authService.logout().subscribe({
      next: () => { },
      error: () => this.authService.clearSession(),
    });
  }
}
