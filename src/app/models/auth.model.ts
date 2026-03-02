import { Role } from './enums';

// --- Auth DTOs ---

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface Verify2FADTO {
  email: string;
  code: string;
}

export interface RegisterUserDTO {
  name: string;
  dni: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponseDTO {
  token: string;
  type: string;
  userId: number;
  email: string;
  name: string;
  role: Role;
}

export interface UserDTO {
  id: number;
  name: string;
  dni: string;
  email: string;
  password: string | null;
  phone: string;
  createdAt: string;
  role: Role;
  enabled: boolean;
  accountLocked: boolean;
  updatedAt: string;
}

// --- Password Reset DTOs ---

export interface PasswordResetRequestDTO {
  email: string;
}

export interface PasswordResetDTO {
  token: string;
  newPassword: string;
}
