import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.post<SaleTransactionResponseDTO>(`${this.baseUrl}/sales`, dto);
  }

  getSales(): Observable<SaleTransactionResponseDTO[]> {
    return this.http.get<SaleTransactionResponseDTO[]>(`${this.baseUrl}/sales`);
  }

  getSalesToday(): Observable<DailySalesSummaryDTO> {
    return this.http.get<DailySalesSummaryDTO>(`${this.baseUrl}/sales/today`);
  }

  getSaleById(id: number): Observable<SaleTransactionResponseDTO> {
    return this.http.get<SaleTransactionResponseDTO>(`${this.baseUrl}/sales/${id}`);
  }
}
