// --- Request DTOs ---

export interface CreateVehicleRequestDTO {
  brand: string;
  model: string;
  yearOfManufacture: number;
  licensePlate: string;
  cylinderCapacity: number;
  chassisNumber: string;
}

export interface UpdateVehicleRequestDTO {
  brand: string;
  model: string;
  cylinderCapacity: number;
}

export interface TransferVehicleOwnershipRequestDTO {
  newOwnerId: number;
}

// --- Response DTO ---

export interface VehicleResponseDTO {
  id: number;
  brand: string;
  model: string;
  yearOfManufacture: number;
  licensePlate: string;
  cylinderCapacity: number;
  chassisNumber: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}
