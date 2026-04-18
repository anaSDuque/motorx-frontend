import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
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
    console.log('[AdminEmployeeService] POST', this.baseUrl, dto);
    return this.http.post<EmployeeResponseDTO>(this.baseUrl, dto).pipe(
      tap((response) => console.log('[AdminEmployeeService] createEmployee success', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('[AdminEmployeeService] createEmployee error', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          error: error.error,
        });
        return throwError(() => error);
      }),
    );
  }

  updateEmployee(employeeId: number, dto: UpdateEmployeeRequestDTO): Observable<EmployeeResponseDTO> {
    return this.http.put<EmployeeResponseDTO>(`${this.baseUrl}/${employeeId}`, dto);
  }

  deleteEmployee(employeeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${employeeId}`);
  }
}
