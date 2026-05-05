export interface AddProcedureToOrderDTO {
  procedureId: number;
  cost: number;
}

export interface AddSpareToOrderDTO {
  spareId: number;
  quantity: number;
}

export interface UpdateOrderProcedureCostDTO {
  cost: number;
}

export interface OrderProcedureResponseDTO {
  procedureId: number;
  procedureName: string;
  cost: number;
}

export interface OrderSpareResponseDTO {
  spareId: number;
  spareName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderResponseDTO {
  id: number;
  appointmentId: number;
  employeeId: number;
  startDate: string;
  endDate: string | null;
  totalServices: number;
  totalSpareParts: number;
  totalToPay: number;
  status: string;
  procedures: OrderProcedureResponseDTO[];
  spares: OrderSpareResponseDTO[];
}
