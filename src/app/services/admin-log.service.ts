import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import { LogPageResponseDTO } from '../models/log.model';

@Injectable({ providedIn: 'root' })
export class AdminLogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/admin/logs`;

  getLogs(page = 0, size = 20, sort = 'createdAt,desc'): Observable<LogPageResponseDTO> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    return this.http.get<LogPageResponseDTO>(this.baseUrl, { params });
  }
}
