import { AppointmentType, AppointmentStatus } from './enums';

// --- Request DTOs ---

export interface CreateAppointmentRequestDTO {
  vehicleId: number;
  appointmentType: AppointmentType;
  appointmentDate: string;
  startTime: string;
  currentMileage: number;
  clientNotes?: string[];
}

export interface CreateUnplannedAppointmentRequestDTO {
  vehicleId: number;
  appointmentType: AppointmentType;
  appointmentDate: string;
  startTime: string;
  currentMileage: number;
  technicianId?: number | null;
  adminNotes?: string;
}

export interface CancelAppointmentRequestDTO {
  reason: string;
  notifyClient: boolean;
}

export interface UpdateAppointmentTechnicianRequestDTO {
  newTechnicianId: number;
  notifyClient: boolean;
}

// --- Response DTOs ---

export interface AppointmentResponseDTO {
  id: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  clientId: number;
  clientFullName: string;
  clientEmail: string;
  technicianId: number | null;
  technicianFullName: string | null;
  currentMileage: number;
  clientNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSlotDTO {
  startTime: string;
  endTime: string;
  availableTechnicians: number;
}

export interface AvailableSlotsResponseDTO {
  date: string;
  appointmentType: AppointmentType;
  availableSlots: AvailableSlotDTO[];
}

export interface LicensePlateRestrictionResponseDTO {
  vehiclePlate: string;
  restrictedDate: string;
  message: string;
  urgentContactMessage: string | null;
  phoneNumber: string | null;
  businessHours: string | null;
}

export interface ReworkRedirectResponseDTO {
  message: string;
  whatsappLink: string;
  phoneNumber: string;
  businessHours: string;
}
