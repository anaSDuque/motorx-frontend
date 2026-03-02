import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import {
  EmployeeResponseDTO,
  CreateEmployeeRequestDTO,
  UpdateEmployeeRequestDTO,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminEmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/admin/employees`;

  getAllEmployees(): Observable<EmployeeResponseDTO[]> {
    return this.http.get<EmployeeResponseDTO[]>(this.baseUrl);
  }

  getEmployeeById(employeeId: number): Observable<EmployeeResponseDTO> {
    return this.http.get<EmployeeResponseDTO>(`${this.baseUrl}/${employeeId}`);
  }

  createEmployee(dto: CreateEmployeeRequestDTO): Observable<EmployeeResponseDTO> {
    return this.http.post<EmployeeResponseDTO>(this.baseUrl, dto);
  }

  updateEmployee(employeeId: number, dto: UpdateEmployeeRequestDTO): Observable<EmployeeResponseDTO> {
    return this.http.put<EmployeeResponseDTO>(`${this.baseUrl}/${employeeId}`, dto);
  }

  deleteEmployee(employeeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${employeeId}`);
  }
}
