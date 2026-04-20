export interface CreatePurchaseItemDTO {
  spareId: number;
  quantity: number;
  purchasePriceWithVat: number;
}

export interface CreatePurchaseTransactionDTO {
  supplier: string;
  items: CreatePurchaseItemDTO[];
}

export interface PurchaseItemResponseDTO {
  id: number;
  spareId: number;
  spareName: string;
  quantity: number;
  purchasePriceWithVat: number;
  lineTotal: number;
}

export interface PurchaseTransactionResponseDTO {
  id: number;
  supplier: string;
  transactionDate: string;
  createdByUserId: number;
  createdByEmail: string;
  totalAmount: number;
  items: PurchaseItemResponseDTO[];
}

export interface CreateSaleItemDTO {
  spareId: number;
  quantity: number;
}

export interface CreateSaleTransactionDTO {
  appointmentId?: number | null;
  items: CreateSaleItemDTO[];
}

export interface SaleItemResponseDTO {
  id: number;
  spareId: number;
  spareName: string;
  quantity: number;
  salePriceAtMoment: number;
  lineTotal: number;
}

export interface SaleTransactionResponseDTO {
  id: number;
  appointmentId: number | null;
  transactionDate: string;
  createdByUserId: number;
  createdByEmail: string;
  totalAmount: number;
  items: SaleItemResponseDTO[];
}

export interface DailySalesSummaryDTO {
  date: string;
  totalSales: number;
  transactionCount: number;
  sales: SaleTransactionResponseDTO[];
}
