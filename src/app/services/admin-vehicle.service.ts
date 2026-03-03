import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import { VehicleResponseDTO, TransferVehicleOwnershipRequestDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminVehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/admin/vehicles`;

  getAllVehicles(): Observable<VehicleResponseDTO[]> {
    return this.http.get<VehicleResponseDTO[]>(this.baseUrl);
  }

  getVehicleById(vehicleId: number): Observable<VehicleResponseDTO> {
    return this.http.get<VehicleResponseDTO>(`${this.baseUrl}/${vehicleId}`);
  }

  transferOwnership(vehicleId: number, dto: TransferVehicleOwnershipRequestDTO): Observable<VehicleResponseDTO> {
    return this.http.patch<VehicleResponseDTO>(`${this.baseUrl}/${vehicleId}/transfer-ownership`, dto);
  }
}
