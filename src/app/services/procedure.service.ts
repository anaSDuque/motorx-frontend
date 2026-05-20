import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  CreateProcedureDTO,
  UpdateProcedureDTO,
  ProcedureResponseDTO,
  UpdateServiceProceduresDTO,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ProcedureService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/procedures`;

  createProcedure(dto: CreateProcedureDTO): Observable<ProcedureResponseDTO> {
    return this.http.post<ProcedureResponseDTO>(this.baseUrl, dto);
  }

  getProcedures(): Observable<ProcedureResponseDTO[]> {
    return this.http.get<ProcedureResponseDTO[]>(this.baseUrl);
  }

  getActiveProcedures(): Observable<ProcedureResponseDTO[]> {
    return this.http.get<ProcedureResponseDTO[]>(`${this.baseUrl}/active`);
  }

  getProcedureById(id: number): Observable<ProcedureResponseDTO> {
    return this.http.get<ProcedureResponseDTO>(`${this.baseUrl}/${id}`);
  }

  updateProcedure(id: number, dto: UpdateProcedureDTO): Observable<ProcedureResponseDTO> {
    return this.http.put<ProcedureResponseDTO>(`${this.baseUrl}/${id}`, dto);
  }

  getProceduresByService(serviceId: number): Observable<ProcedureResponseDTO[]> {
    return this.http.get<ProcedureResponseDTO[]>(`${BASE_API}/v1/services/${serviceId}/procedures`);
  }

  updateServiceProcedures(serviceId: number, dto: UpdateServiceProceduresDTO): Observable<ProcedureResponseDTO[]> {
    return this.http.put<ProcedureResponseDTO[]>(`${BASE_API}/v1/services/${serviceId}/procedures`, dto);
  }
}
