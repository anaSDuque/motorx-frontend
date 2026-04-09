import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import { ConfirmReceptionDTO, ReceptionActionResponseDTO } from '../models/reception.model';

@Injectable({ providedIn: 'root' })
export class ReceptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/reception`;

  initiateReception(appointmentId: number): Observable<ReceptionActionResponseDTO> {
    return this.http.post<ReceptionActionResponseDTO>(`${this.baseUrl}/initiate/${appointmentId}`, {});
  }

  confirmReception(dto: ConfirmReceptionDTO): Observable<ReceptionActionResponseDTO> {
    return this.http.post<ReceptionActionResponseDTO>(`${this.baseUrl}/confirm`, dto);
  }
}
