export interface CreateProcedureDTO {
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface UpdateProcedureDTO {
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface ProcedureResponseDTO {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateServiceProceduresDTO {
  procedureIds: number[];
}
