import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import { AdminUserResponseDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/admin/users`;

  getAllUsers(): Observable<AdminUserResponseDTO[]> {
    return this.http.get<AdminUserResponseDTO[]>(this.baseUrl);
  }

  getUserById(userId: number): Observable<AdminUserResponseDTO> {
    return this.http.get<AdminUserResponseDTO>(`${this.baseUrl}/${userId}`);
  }

  blockUser(userId: number): Observable<AdminUserResponseDTO> {
    return this.http.patch<AdminUserResponseDTO>(`${this.baseUrl}/${userId}/block`, {});
  }

  unblockUser(userId: number): Observable<AdminUserResponseDTO> {
    return this.http.patch<AdminUserResponseDTO>(`${this.baseUrl}/${userId}/unblock`, {});
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}`);
  }
}
