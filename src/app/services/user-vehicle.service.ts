import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  VehicleResponseDTO,
  CreateVehicleRequestDTO,
  UpdateVehicleRequestDTO,
} from '../models';

@Injectable({ providedIn: 'root' })
export class UserVehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/user/vehicles`;

  getMyVehicles(): Observable<VehicleResponseDTO[]> {
    return this.http.get<VehicleResponseDTO[]>(this.baseUrl);
  }

  getVehicleById(vehicleId: number): Observable<VehicleResponseDTO> {
    return this.http.get<VehicleResponseDTO>(`${this.baseUrl}/${vehicleId}`);
  }

  createVehicle(dto: CreateVehicleRequestDTO): Observable<VehicleResponseDTO> {
    return this.http.post<VehicleResponseDTO>(this.baseUrl, dto);
  }

  updateVehicle(vehicleId: number, dto: UpdateVehicleRequestDTO): Observable<VehicleResponseDTO> {
    return this.http.put<VehicleResponseDTO>(`${this.baseUrl}/${vehicleId}`, dto);
  }

  deleteVehicle(vehicleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${vehicleId}`);
  }
}
