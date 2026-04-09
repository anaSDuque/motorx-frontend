export interface CreatePurchaseItemDTO {
  spareId: number;
  quantity: number;
  purchasePriceWithVat: number;
}

export interface CreatePurchaseTransactionDTO {
  notes?: string;
  items: CreatePurchaseItemDTO[];
}

export interface PurchaseItemResponseDTO {
  id: number;
  spareId: number;
  spareCode: string;
  spareName: string;
  quantity: number;
  purchasePriceWithVat: number;
  subtotal: number;
}

export interface PurchaseTransactionResponseDTO {
  id: number;
  total: number;
  notes: string | null;
  createdAt: string;
  createdByUserId: number;
  items: PurchaseItemResponseDTO[];
}

export interface CreateSaleItemDTO {
  spareId: number;
  quantity: number;
}

export interface CreateSaleTransactionDTO {
  appointmentId?: number | null;
  notes?: string;
  items: CreateSaleItemDTO[];
}

export interface SaleItemResponseDTO {
  id: number;
  spareId: number;
  spareCode: string;
  spareName: string;
  quantity: number;
  unitSalePrice: number;
  subtotal: number;
}

export interface SaleTransactionResponseDTO {
  id: number;
  appointmentId: number | null;
  total: number;
  notes: string | null;
  createdAt: string;
  createdByUserId: number;
  items: SaleItemResponseDTO[];
}

export interface DailySalesSummaryDTO {
  date: string;
  totalTransactions: number;
  totalItemsSold: number;
  totalAmount: number;
}
