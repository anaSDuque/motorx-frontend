export interface PerformanceMetricsDTO {
  endpoint: string;
  avgResponseTimeMs: number;
  totalRequests: number;
  requestsUnderThreshold: number;
  compliancePercent: number;
}

export interface SecurityMetricsDTO {
  unauthorizedAttempts401: number;
  forbiddenAttempts403: number;
  totalProtectedEndpoints: number;
  endpointsWithAuthEnforced: number;
  accessControlCompliancePercent: number;
}

export interface MaintainabilityMetricsDTO {
  totalControllers: number;
  totalServices: number;
  totalRepositories: number;
  standardizedErrorHandlingEnabled: boolean;
  jacocoCoverageGatePercent: number;
}

export interface AppointmentsMetricsDTO {
  totalCreationAttempts: number;
  successfulAppointments: number;
  rejectedByBusinessRules: number;
  businessRuleCompliancePercent: number;
  totalAppointmentsInDB: number;
  validRecordsInDB: number;
  dataIntegrityPercent: number;
}

export interface MetricsSummaryDTO {
  performance: PerformanceMetricsDTO[];
  security: SecurityMetricsDTO;
  maintainability: MaintainabilityMetricsDTO;
  appointments: AppointmentsMetricsDTO;
}

export interface InventoryTopSellingMetricDTO {
  spareId: number;
  savCode: string;
  spareName: string;
  unitsSold: number;
}

export interface InventoryProfitMetricDTO {
  startDate: string;
  endDate: string;
  totalUnitsSold: number;
  grossSalesAmount: number;
  estimatedProfitAmount: number;
}

export interface InventoryStagnantMetricDTO {
  spareId: number;
  savCode: string;
  spareName: string;
  currentStock: number;
  lastSaleDate: string | null;
  daysWithoutSales: number | null;
  neverSold: boolean;
}

export interface InventoryBelowThresholdPercentageDTO {
  sparesBelowThreshold: number;
  sparesWithThreshold: number;
  belowThresholdPercent: number;
}
