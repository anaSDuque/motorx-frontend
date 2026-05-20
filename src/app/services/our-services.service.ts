import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  CreateServiceDTO,
  UpdateServiceDTO,
  ServiceResponseDTO,
  ProcedureResponseDTO,
  UpdateServiceProceduresDTO,
} from '../models';

@Injectable({ providedIn: 'root' })
export class OurServicesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/services`;

  getServices(): Observable<ServiceResponseDTO[]> {
    return this.http.get<ServiceResponseDTO[]>(this.baseUrl);
  }

  getServiceById(id: number): Observable<ServiceResponseDTO> {
    return this.http.get<ServiceResponseDTO>(`${this.baseUrl}/${id}`);
  }

  createService(dto: CreateServiceDTO): Observable<ServiceResponseDTO> {
    return this.http.post<ServiceResponseDTO>(this.baseUrl, dto);
  }

  updateService(id: number, dto: UpdateServiceDTO): Observable<ServiceResponseDTO> {
    return this.http.put<ServiceResponseDTO>(`${this.baseUrl}/${id}`, dto);
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getServiceProcedures(serviceId: number): Observable<ProcedureResponseDTO[]> {
    return this.http.get<ProcedureResponseDTO[]>(`${this.baseUrl}/${serviceId}/procedures`);
  }

  updateServiceProcedures(
    serviceId: number,
    dto: UpdateServiceProceduresDTO
  ): Observable<ProcedureResponseDTO[]> {
    return this.http.put<ProcedureResponseDTO[]>(`${this.baseUrl}/${serviceId}/procedures`, dto);
  }
}
