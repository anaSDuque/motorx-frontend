import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  CreateNotificationDTO,
  MarkAllNotificationsReadResponseDTO,
  NotificationResponseDTO,
} from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/notifications`;

  createAdminNotification(dto: CreateNotificationDTO): Observable<NotificationResponseDTO> {
    return this.http.post<NotificationResponseDTO>(`${this.baseUrl}/admin`, dto);
  }

  getMyNotifications(onlyUnread = false): Observable<NotificationResponseDTO[]> {
    const params = new HttpParams().set('onlyUnread', String(onlyUnread));
    return this.http.get<NotificationResponseDTO[]>(`${this.baseUrl}/my`, { params });
  }

  markMyNotificationAsRead(notificationId: number): Observable<NotificationResponseDTO> {
    return this.http.patch<NotificationResponseDTO>(
      `${this.baseUrl}/my/${notificationId}/read`,
      {}
    );
  }

  markAllMyNotificationsAsRead(): Observable<MarkAllNotificationsReadResponseDTO> {
    return this.http.patch<MarkAllNotificationsReadResponseDTO>(`${this.baseUrl}/my/read-all`, {});
  }

  getNotificationsByUserAsAdmin(userId: number): Observable<NotificationResponseDTO[]> {
    return this.http.get<NotificationResponseDTO[]>(`${this.baseUrl}/admin/user/${userId}`);
  }
}

