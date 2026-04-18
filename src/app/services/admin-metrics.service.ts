import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  PerformanceMetricsDTO,
  SecurityMetricsDTO,
  MaintainabilityMetricsDTO,
  AppointmentsMetricsDTO,
  MetricsSummaryDTO,
  InventoryTopSellingMetricDTO,
  InventoryProfitMetricDTO,
  InventoryStagnantMetricDTO,
  InventoryBelowThresholdPercentageDTO,
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

  getInventoryTopSelling(limit = 10): Observable<InventoryTopSellingMetricDTO[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<InventoryTopSellingMetricDTO[]>(`${this.baseUrl}/inventory/top-selling`, { params });
  }

  getInventoryProfit(startDate: string, endDate: string): Observable<InventoryProfitMetricDTO> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<InventoryProfitMetricDTO>(`${this.baseUrl}/inventory/profit`, { params });
  }

  getInventoryStagnant(daysWithoutSales = 60): Observable<InventoryStagnantMetricDTO[]> {
    const params = new HttpParams().set('daysWithoutSales', daysWithoutSales);
    return this.http.get<InventoryStagnantMetricDTO[]>(`${this.baseUrl}/inventory/stagnant`, { params });
  }

  getInventoryBelowThresholdPercentage(): Observable<InventoryBelowThresholdPercentageDTO> {
    return this.http.get<InventoryBelowThresholdPercentageDTO>(`${this.baseUrl}/inventory/below-threshold-percentage`);
  }
}
