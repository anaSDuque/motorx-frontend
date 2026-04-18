import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { BASE_API } from './api.config';
import {
  LoginRequestDTO,
  Verify2FADTO,
  RegisterUserDTO,
  AuthResponseDTO,
  UserDTO,
  Role,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _currentUser = signal<UserDTO | null>(null);
  private readonly _token = signal<string | null>(
    this.isBrowser ? localStorage.getItem('motorx_token') : null
  );

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly isAdmin = computed(() => this._currentUser()?.role === Role.ADMIN);

  login(dto: LoginRequestDTO): Observable<AuthResponseDTO | { message: string }> {
    return this.http.post(`${BASE_API}/auth/login`, dto, { responseType: 'text' }).pipe(
      map((res) => {
        try {
          return JSON.parse(res) as AuthResponseDTO;
        } catch (e) {
          return { message: res };
        }
      })
    );
  }

  verify2FA(dto: Verify2FADTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${BASE_API}/auth/verify-2fa`, dto).pipe(
      tap((res) => this.handleAuthResponse(res))
    );
  }

  register(dto: RegisterUserDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${BASE_API}/auth/register`, dto).pipe(
      tap((res) => this.handleAuthResponse(res))
    );
  }

  getMe(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${BASE_API}/auth/me`).pipe(
      tap((user) => this._currentUser.set(user))
    );
  }

  logout(): Observable<string> {
    return this.http.get(`${BASE_API}/auth/logout`, { responseType: 'text' }).pipe(
      tap(() => this.clearSession())
    );
  }

  refreshToken(refreshToken: string): Observable<AuthResponseDTO> {
    return this.http
      .post<AuthResponseDTO>(`${BASE_API}/auth/refresh?refreshToken=${refreshToken}`, {})
      .pipe(tap((res) => this.handleAuthResponse(res)));
  }

  handleAuthResponse(res: AuthResponseDTO): void {
    if (!res?.token || typeof res.token !== 'string' || res.token.trim().length === 0) {
      throw new Error('Respuesta de autenticación inválida: token ausente');
    }

    const normalizedRole = this.normalizeRoleValue(String(res.role));
    if (!normalizedRole) {
      throw new Error(`Respuesta de autenticación inválida: rol no soportado (${String(res.role)})`);
    }

    this._token.set(res.token);

    if (this.isBrowser) {
      localStorage.setItem('motorx_token', res.token);
      localStorage.setItem('motorx_role', normalizedRole);
      localStorage.setItem('motorx_user_name', res.name);
      localStorage.setItem('motorx_user_id', String(res.userId));
      localStorage.removeItem('motorx_employee_position');
    }
  }

  getToken(): string | null {
    return this._token();
  }

  getStoredRole(): Role | null {
    if (!this.isBrowser) return null;
    return this.normalizeRoleValue(localStorage.getItem('motorx_role'));
  }

  getStoredUserName(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('motorx_user_name');
  }

  clearSession(): void {
    this._token.set(null);
    this._currentUser.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('motorx_token');
      localStorage.removeItem('motorx_role');
      localStorage.removeItem('motorx_user_name');
      localStorage.removeItem('motorx_user_id');
      localStorage.removeItem('motorx_employee_position');
    }
    this.router.navigate(['/login']);
  }

  private normalizeRoleValue(rawRole: string | null): Role | null {
    if (!rawRole) return null;

    const cleanRole = rawRole
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^ROLE_/, '')
      .replace(/[\s-]+/g, '_');

    if (cleanRole === Role.ADMIN) return Role.ADMIN;
    if (cleanRole === Role.CLIENT || cleanRole === 'USER') return Role.CLIENT;

    if (cleanRole === Role.WARE_HOUSE_WORKER || cleanRole === 'WAREHOUSE_WORKER') {
      return Role.WARE_HOUSE_WORKER;
    }

    if (cleanRole === Role.RECEPTIONIST || cleanRole === 'RECEPCIONISTA') {
      return Role.RECEPTIONIST;
    }

    if (cleanRole === Role.TECHNICIAN || cleanRole === 'MECHANIC' || cleanRole === 'MECANICO') {
      return Role.TECHNICIAN;
    }

    if (cleanRole === Role.EMPLOYEE) return Role.EMPLOYEE;

    return null;
  }
}
