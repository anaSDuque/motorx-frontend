import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  CreateSpareDTO,
  SpareFiltersDTO,
  UpdateSpareDTO,
  UpdateSparePurchasePriceDTO,
  SpareResponseDTO,
} from '../models';

@Injectable({ providedIn: 'root' })
export class SpareService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/spares`;

  createSpare(dto: CreateSpareDTO): Observable<SpareResponseDTO> {
    return this.http.post<SpareResponseDTO>(this.baseUrl, dto);
  }

  getSpares(filters?: SpareFiltersDTO): Observable<SpareResponseDTO[]> {
    let params = new HttpParams();

    if (filters?.name?.trim()) {
      params = params.set('name', filters.name.trim());
    }
    if (filters?.savCode?.trim()) {
      params = params.set('savCode', filters.savCode.trim());
    }

    return this.http.get<SpareResponseDTO[]>(this.baseUrl, { params });
  }

  getSparesBelowThreshold(): Observable<SpareResponseDTO[]> {
    return this.http.get<SpareResponseDTO[]>(`${this.baseUrl}/below-threshold`);
  }

  getSpareById(id: number): Observable<SpareResponseDTO> {
    return this.http.get<SpareResponseDTO>(`${this.baseUrl}/${id}`);
  }

  updateSpare(id: number, dto: UpdateSpareDTO): Observable<SpareResponseDTO> {
    return this.http.put<SpareResponseDTO>(`${this.baseUrl}/${id}`, dto);
  }

  updatePurchasePrice(id: number, dto: UpdateSparePurchasePriceDTO): Observable<SpareResponseDTO> {
    return this.http.patch<SpareResponseDTO>(`${this.baseUrl}/${id}/purchase-price`, dto);
  }

  deleteSpare(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  notifyRestock(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/notify-restock`, {});
  }
}
