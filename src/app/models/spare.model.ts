export interface CreateSpareDTO {
  savCode: string;
  spareCode: string;
  name: string;
  description?: string;
  quantity: number;
  purchasePriceWithVat: number;
  isOil: boolean;
  warehouseLocation: string;
  stockThreshold: number;
}

export interface UpdateSpareDTO {
  savCode: string;
  spareCode: string;
  name: string;
  description?: string;
  quantity: number;
  purchasePriceWithVat: number;
  isOil: boolean;
  warehouseLocation: string;
  stockThreshold: number;
}

export interface UpdateSparePurchasePriceDTO {
  purchasePriceWithVat: number;
}

export interface SpareResponseDTO {
  id: number;
  savCode: string;
  spareCode: string;
  name: string;
  description: string | null;
  quantity: number;
  purchasePriceWithVat: number;
  salePrice: number;
  isOil: boolean;
  warehouseLocation: string;
  stockThreshold: number;
  createdAt: string;
  updatedAt: string;
}
