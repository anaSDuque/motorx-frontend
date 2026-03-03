import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  AppointmentResponseDTO,
  AvailableSlotsResponseDTO,
  CreateUnplannedAppointmentRequestDTO,
  CancelAppointmentRequestDTO,
  UpdateAppointmentTechnicianRequestDTO,
  AppointmentType,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminAppointmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/admin/appointments`;

  getAgenda(date: string): Observable<AppointmentResponseDTO[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<AppointmentResponseDTO[]>(`${this.baseUrl}/agenda`, { params });
  }

  getCalendar(start: string, end: string): Observable<AppointmentResponseDTO[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<AppointmentResponseDTO[]>(`${this.baseUrl}/calendar`, { params });
  }

  getAvailableSlots(date: string, type: AppointmentType): Observable<AvailableSlotsResponseDTO> {
    const params = new HttpParams().set('date', date).set('type', type);
    return this.http.get<AvailableSlotsResponseDTO>(`${this.baseUrl}/available-slots`, { params });
  }

  createUnplannedAppointment(dto: CreateUnplannedAppointmentRequestDTO): Observable<AppointmentResponseDTO> {
    return this.http.post<AppointmentResponseDTO>(`${this.baseUrl}/unplanned`, dto);
  }

  cancelAppointment(appointmentId: number, dto: CancelAppointmentRequestDTO): Observable<AppointmentResponseDTO> {
    return this.http.patch<AppointmentResponseDTO>(`${this.baseUrl}/${appointmentId}/cancel`, dto);
  }

  updateTechnician(appointmentId: number, dto: UpdateAppointmentTechnicianRequestDTO): Observable<AppointmentResponseDTO> {
    return this.http.patch<AppointmentResponseDTO>(`${this.baseUrl}/${appointmentId}/technician`, dto);
  }

  getAppointmentById(appointmentId: number): Observable<AppointmentResponseDTO> {
    return this.http.get<AppointmentResponseDTO>(`${this.baseUrl}/${appointmentId}`);
  }

  getClientAppointments(clientId: number): Observable<AppointmentResponseDTO[]> {
    return this.http.get<AppointmentResponseDTO[]>(`${this.baseUrl}/client/${clientId}`);
  }

  getVehicleAppointments(vehicleId: number): Observable<AppointmentResponseDTO[]> {
    return this.http.get<AppointmentResponseDTO[]>(`${this.baseUrl}/vehicle/${vehicleId}`);
  }
}
