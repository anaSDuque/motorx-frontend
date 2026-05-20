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

export interface TechnicianDailyOrderDTO {
  appointmentId: number;
  orderId: number;
  licensePlate: string;
  brand: string;
  model: string;
  appointmentDate: string;
  startTime: string;
  processStartedAt: string;
}

export interface TechnicianAppointmentSummaryDTO {
  appointmentId: number;
  appointmentType: string;
  status: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  currentMileage: number;
  clientNotes: string | null;
  clientFullName: string;
  technicianId: number | null;
  technicianFullName: string | null;
}
