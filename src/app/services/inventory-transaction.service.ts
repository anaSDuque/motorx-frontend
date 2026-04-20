import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BASE_API } from './api.config';
import {
  CreatePurchaseTransactionDTO,
  PurchaseTransactionResponseDTO,
  CreateSaleTransactionDTO,
  SaleTransactionResponseDTO,
  DailySalesSummaryDTO,
} from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryTransactionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/inventory`;

  createPurchase(dto: CreatePurchaseTransactionDTO): Observable<PurchaseTransactionResponseDTO> {
    return this.http.post<PurchaseTransactionResponseDTO>(`${this.baseUrl}/purchases`, dto);
  }

  getPurchases(): Observable<PurchaseTransactionResponseDTO[]> {
    return this.http.get<PurchaseTransactionResponseDTO[]>(`${this.baseUrl}/purchases`);
  }

  getPurchaseById(id: number): Observable<PurchaseTransactionResponseDTO> {
    return this.http.get<PurchaseTransactionResponseDTO>(`${this.baseUrl}/purchases/${id}`);
  }

  createSale(dto: CreateSaleTransactionDTO): Observable<SaleTransactionResponseDTO> {
    return this.http
      .post<unknown>(`${this.baseUrl}/sales`, dto)
      .pipe(map((sale) => this.normalizeSaleResponse(sale)));
  }

  getSales(): Observable<SaleTransactionResponseDTO[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/sales`).pipe(
      map((sales) => sales.map((sale) => this.normalizeSaleResponse(sale)))
    );
  }

  getSalesToday(): Observable<DailySalesSummaryDTO> {
    return this.http.get<DailySalesSummaryDTO>(`${this.baseUrl}/sales/today`);
  }

  getSaleById(id: number): Observable<SaleTransactionResponseDTO> {
    return this.http
      .get<unknown>(`${this.baseUrl}/sales/${id}`)
      .pipe(map((sale) => this.normalizeSaleResponse(sale)));
  }

  private normalizeSaleResponse(raw: unknown): SaleTransactionResponseDTO {
    const source = this.asRecord(raw);

    return {
      id: Number(source['id'] ?? 0),
      appointmentId: this.toNumberOrNull(source['appointmentId']),
      total: Number(source['totalAmount'] ?? source['total'] ?? 0),
      notes: this.toNullableString(source['notes']),
      createdAt: String(source['transactionDate'] ?? source['createdAt'] ?? ''),
      createdByUserId: Number(source['createdByUserId'] ?? 0),
      items: Array.isArray(source['items'])
        ? (source['items'] as SaleTransactionResponseDTO['items'])
        : [],
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private toNullableString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized ? normalized : null;
  }
}
