import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import { PasswordResetRequestDTO, PasswordResetDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  private readonly http = inject(HttpClient);

  requestReset(dto: PasswordResetRequestDTO): Observable<string> {
    return this.http.post(`${BASE_API}/password-reset/request`, dto, { responseType: 'text' });
  }

  resetPassword(dto: PasswordResetDTO): Observable<string> {
    return this.http.put(`${BASE_API}/password-reset`, dto, { responseType: 'text' });
  }
}
