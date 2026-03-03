import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  AppointmentResponseDTO,
  AvailableSlotsResponseDTO,
  LicensePlateRestrictionResponseDTO,
  ReworkRedirectResponseDTO,
  CreateAppointmentRequestDTO,
  AppointmentType,
} from '../models';

@Injectable({ providedIn: 'root' })
export class UserAppointmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/user/appointments`;

  getAvailableSlots(date: string, type: AppointmentType): Observable<AvailableSlotsResponseDTO> {
    const params = new HttpParams().set('date', date).set('type', type);
    return this.http.get<AvailableSlotsResponseDTO>(`${this.baseUrl}/available-slots`, { params });
  }

  checkPlateRestriction(vehicleId: number, date: string): Observable<LicensePlateRestrictionResponseDTO> {
    const params = new HttpParams().set('vehicleId', vehicleId).set('date', date);
    return this.http.get<LicensePlateRestrictionResponseDTO>(`${this.baseUrl}/check-plate-restriction`, { params });
  }

  getReworkInfo(): Observable<ReworkRedirectResponseDTO> {
    return this.http.get<ReworkRedirectResponseDTO>(`${this.baseUrl}/rework-info`);
  }

  createAppointment(dto: CreateAppointmentRequestDTO): Observable<AppointmentResponseDTO> {
    return this.http.post<AppointmentResponseDTO>(this.baseUrl, dto);
  }

  getMyAppointments(): Observable<AppointmentResponseDTO[]> {
    return this.http.get<AppointmentResponseDTO[]>(`${this.baseUrl}/my`);
  }

  getMyAppointmentById(appointmentId: number): Observable<AppointmentResponseDTO> {
    return this.http.get<AppointmentResponseDTO>(`${this.baseUrl}/my/${appointmentId}`);
  }

  getMyVehicleAppointments(vehicleId: number): Observable<AppointmentResponseDTO[]> {
    return this.http.get<AppointmentResponseDTO[]>(`${this.baseUrl}/my/vehicle/${vehicleId}`);
  }

  cancelMyAppointment(appointmentId: number): Observable<AppointmentResponseDTO> {
    return this.http.delete<AppointmentResponseDTO>(`${this.baseUrl}/my/${appointmentId}`);
  }
}
