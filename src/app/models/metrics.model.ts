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
