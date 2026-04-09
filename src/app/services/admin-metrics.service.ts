import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  PerformanceMetricsDTO,
  SecurityMetricsDTO,
  MaintainabilityMetricsDTO,
  AppointmentsMetricsDTO,
  MetricsSummaryDTO,
} from '../models/metrics.model';

@Injectable({ providedIn: 'root' })
export class AdminMetricsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/admin/metrics`;

  getPerformance(): Observable<PerformanceMetricsDTO[]> {
    return this.http.get<PerformanceMetricsDTO[]>(`${this.baseUrl}/performance`);
  }

  getSecurity(): Observable<SecurityMetricsDTO> {
    return this.http.get<SecurityMetricsDTO>(`${this.baseUrl}/security`);
  }

  getMaintainability(): Observable<MaintainabilityMetricsDTO> {
    return this.http.get<MaintainabilityMetricsDTO>(`${this.baseUrl}/maintainability`);
  }

  getAppointments(): Observable<AppointmentsMetricsDTO> {
    return this.http.get<AppointmentsMetricsDTO>(`${this.baseUrl}/appointments`);
  }

  getSummary(): Observable<MetricsSummaryDTO> {
    return this.http.get<MetricsSummaryDTO>(`${this.baseUrl}/summary`);
  }
}
