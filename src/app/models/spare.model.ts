export interface CreateSpareDTO {
  name: string;
  compatibleMotorcycles: string;
  savCode: string;
  spareCode: string;
  supplier: string;
  quantity: number;
  purchasePriceWithVat: number;
  isOil: boolean;
  stockThreshold: number;
  warehouseLocation: string;
}

export interface SpareFiltersDTO {
  name?: string;
  savCode?: string;
}

export interface UpdateSpareDTO {
  name: string;
  compatibleMotorcycles: string;
  savCode: string;
  spareCode: string;
  supplier: string;
  quantity: number;
  purchasePriceWithVat: number;
  isOil: boolean;
  stockThreshold: number;
  warehouseLocation: string;
}

export interface UpdateSparePurchasePriceDTO {
  purchasePriceWithVat: number;
}

export interface SpareResponseDTO {
  id: number;
  name: string;
  compatibleMotorcycles: string;
  savCode: string;
  spareCode: string;
  supplier: string;
  quantity: number;
  purchasePriceWithVat: number;
  salePrice: number;
  isOil: boolean;
  warehouseLocation: string;
  stockThreshold: number;
}
