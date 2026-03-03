import { Role } from './enums';

export interface AdminUserResponseDTO {
  id: number;
  name: string;
  dni: string;
  email: string;
  phone: string;
  role: Role;
  enabled: boolean;
  accountLocked: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
