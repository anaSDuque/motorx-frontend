export enum AppointmentType {
  MANUAL_WARRANTY_REVIEW = 'MANUAL_WARRANTY_REVIEW',
  AUTECO_WARRANTY = 'AUTECO_WARRANTY',
  QUICK_SERVICE = 'QUICK_SERVICE',
  MAINTENANCE = 'MAINTENANCE',
  OIL_CHANGE = 'OIL_CHANGE',
  UNPLANNED = 'UNPLANNED',
  REWORK = 'REWORK',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  NO_SHOW = 'NO_SHOW',
}

export enum EmployeePosition {
  RECEPCIONISTA = 'RECEPCIONISTA',
  MECANICO = 'MECANICO',
}

export enum EmployeeState {
  AVAILABLE = 'AVAILABLE',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export enum Role {
  CLIENT = 'CLIENT',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
}

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  [AppointmentType.MANUAL_WARRANTY_REVIEW]: 'Revisión de garantía de manual',
  [AppointmentType.AUTECO_WARRANTY]: 'Garantía Auteco',
  [AppointmentType.QUICK_SERVICE]: 'Servicio rápido',
  [AppointmentType.MAINTENANCE]: 'Mantenimiento general',
  [AppointmentType.OIL_CHANGE]: 'Cambio de aceite',
  [AppointmentType.UNPLANNED]: 'Cita no planeada',
  [AppointmentType.REWORK]: 'Reproceso',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Agendada',
  [AppointmentStatus.IN_PROGRESS]: 'En progreso',
  [AppointmentStatus.COMPLETED]: 'Completada',
  [AppointmentStatus.CANCELLED]: 'Cancelada',
  [AppointmentStatus.REJECTED]: 'Rechazada',
  [AppointmentStatus.NO_SHOW]: 'No asistió',
};

export const EMPLOYEE_POSITION_LABELS: Record<EmployeePosition, string> = {
  [EmployeePosition.RECEPCIONISTA]: 'Recepcionista',
  [EmployeePosition.MECANICO]: 'Mecánico',
};

export const EMPLOYEE_STATE_LABELS: Record<EmployeeState, string> = {
  [EmployeeState.AVAILABLE]: 'Disponible',
  [EmployeeState.NOT_AVAILABLE]: 'No disponible',
};
