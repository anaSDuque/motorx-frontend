import { ProcedureResponseDTO } from './procedure.model';

export interface CreateServiceDTO {
  name: string;
  description?: string | null;
  estimatedDurationMinutes: number;
  basePrice: number;
  active?: boolean;
  procedureIds?: number[];
}

export interface UpdateServiceDTO {
  name: string;
  description?: string | null;
  estimatedDurationMinutes: number;
  basePrice: number;
  active?: boolean;
}

export interface ServiceResponseDTO {
  id: number;
  name: string;
  description: string | null;
  estimatedDurationMinutes: number;
  basePrice: number;
  active: boolean;
  baseProcedures: ProcedureResponseDTO[];
  createdAt: string;
  updatedAt: string;
}
