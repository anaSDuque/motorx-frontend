import { EmployeePosition, EmployeeState } from './enums';
import { RegisterUserDTO } from './auth.model';

// --- Request DTOs ---

export interface CreateEmployeeRequestDTO {
  position: EmployeePosition;
  user: RegisterUserDTO;
}

export interface UpdateEmployeeRequestDTO {
  position: EmployeePosition;
  state: EmployeeState;
}

// --- Response DTO ---

export interface EmployeeResponseDTO {
  employeeId: number;
  position: EmployeePosition;
  state: EmployeeState;
  hireDate: string;
  userId: number;
  userName: string;
  userEmail: string;
  userDni: string;
  userPhone: string;
  createdAt: string;
  updatedAt: string;
}
