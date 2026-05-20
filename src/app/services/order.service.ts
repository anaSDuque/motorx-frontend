import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  AddProcedureToOrderDTO,
  AddSpareToOrderDTO,
  UpdateOrderProcedureCostDTO,
  OrderResponseDTO,
  TechnicianDailyOrderDTO,
  TechnicianAppointmentSummaryDTO,
} from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/orders`;

  createOrderByAppointment(appointmentId: number): Observable<OrderResponseDTO> {
    return this.http.post<OrderResponseDTO>(`${this.baseUrl}/appointment/${appointmentId}`, {});
  }

  getOrderByAppointment(appointmentId: number): Observable<OrderResponseDTO> {
    return this.http.get<OrderResponseDTO>(`${this.baseUrl}/appointment/${appointmentId}`);
  }

  addProcedure(orderId: number, dto: AddProcedureToOrderDTO): Observable<OrderResponseDTO> {
    return this.http.post<OrderResponseDTO>(`${this.baseUrl}/${orderId}/procedures`, dto);
  }

  updateProcedureCost(orderId: number, procedureId: number, dto: UpdateOrderProcedureCostDTO): Observable<OrderResponseDTO> {
    return this.http.patch<OrderResponseDTO>(`${this.baseUrl}/${orderId}/procedures/${procedureId}`, dto);
  }

  addSpare(orderId: number, dto: AddSpareToOrderDTO): Observable<OrderResponseDTO> {
    return this.http.post<OrderResponseDTO>(`${this.baseUrl}/${orderId}/spares`, dto);
  }

  completeOrder(orderId: number): Observable<OrderResponseDTO> {
    return this.http.post<OrderResponseDTO>(`${this.baseUrl}/${orderId}/complete`, {});
  }

  getMyTodayOrders(): Observable<TechnicianDailyOrderDTO[]> {
    return this.http.get<TechnicianDailyOrderDTO[]>(`${this.baseUrl}/my/today`);
  }

  getAppointmentSummary(appointmentId: number): Observable<TechnicianAppointmentSummaryDTO> {
    return this.http.get<TechnicianAppointmentSummaryDTO>(`${this.baseUrl}/appointment/${appointmentId}/summary`);
  }
}
