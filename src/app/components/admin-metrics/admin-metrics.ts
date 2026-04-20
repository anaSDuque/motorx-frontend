import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { AdminMetricsService } from '../../services/admin-metrics.service';
import {
  InventoryBelowThresholdPercentageDTO,
  InventoryProfitMetricDTO,
  InventoryStagnantMetricDTO,
  InventoryTopSellingMetricDTO,
  MetricsSummaryDTO,
} from '../../models/metrics.model';

type DashboardChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  labels: string[];
  colors: string[];
  fill: ApexFill;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  responsive: ApexResponsive[];
  grid: ApexGrid;
};

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [ReactiveFormsModule, NgApexchartsModule],
  templateUrl: './admin-metrics.html',
  styleUrl: './admin-metrics.css',
})
export class AdminMetrics implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly metricsService = inject(AdminMetricsService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly summary = signal<MetricsSummaryDTO | null>(null);
  protected readonly inventoryTopSelling = signal<InventoryTopSellingMetricDTO[]>([]);
  protected readonly inventoryProfit = signal<InventoryProfitMetricDTO | null>(null);
  protected readonly inventoryStagnant = signal<InventoryStagnantMetricDTO[]>([]);
  protected readonly inventoryBelowThreshold = signal<InventoryBelowThresholdPercentageDTO | null>(null);

  protected securityAttemptsChart: any = {};
  protected accessComplianceChart: any = {};
  protected inventoryTopSellingChart: any = {};
  protected inventoryStagnantChart: any = {};
  protected inventoryProfitChart: any = {};
  protected thresholdChart: any = {};
  protected appointmentsChart: any = {};
  protected maintainabilityChart: any = {};
  protected performanceChart: any = {};

  protected readonly inventoryFiltersForm = this.fb.nonNullable.group({
    topSellingLimit: [10, [Validators.required, Validators.min(1)]],
    profitStartDate: [this.getMonthStartDate(), [Validators.required]],
    profitEndDate: [this.getTodayDate(), [Validators.required]],
    stagnantDays: [60, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadSummary();
  }

  protected loadSummary(): void {
    this.inventoryFiltersForm.markAllAsTouched();
    if (this.inventoryFiltersForm.invalid) {
      this.error.set('Verifica los filtros de métricas de inventario.');
      return;
    }

    const filters = this.inventoryFiltersForm.getRawValue();
    if (filters.profitStartDate > filters.profitEndDate) {
      this.error.set('La fecha inicial no puede ser mayor que la fecha final.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    forkJoin({
      summary: this.metricsService.getSummary(),
      topSelling: this.metricsService.getInventoryTopSelling(filters.topSellingLimit),
      profit: this.metricsService.getInventoryProfit(filters.profitStartDate, filters.profitEndDate),
      stagnant: this.metricsService.getInventoryStagnant(filters.stagnantDays),
      belowThreshold: this.metricsService.getInventoryBelowThresholdPercentage(),
    }).subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.inventoryTopSelling.set(data.topSelling);
        this.inventoryProfit.set(data.profit);
        this.inventoryStagnant.set(data.stagnant);
        this.inventoryBelowThreshold.set(data.belowThreshold);
        this.buildCharts();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar métricas');
        this.loading.set(false);
      },
    });
  }

  private buildCharts(): void {
    const summary = this.summary();
    const profit = this.inventoryProfit();
    const belowThreshold = this.inventoryBelowThreshold();

    if (!summary || !profit || !belowThreshold) {
      return;
    }

    this.securityAttemptsChart = {
      series: [summary.security.unauthorizedAttempts401, summary.security.forbiddenAttempts403],
      chart: { type: 'donut', height: 300, toolbar: { show: true } },
      labels: ['Unauthorized', 'Forbidden'],
      colors: ['#ef4444', '#f59e0b'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true },
      stroke: { width: 2 },
      responsive: [{ breakpoint: 768, options: { chart: { height: 260 } } }],
    };

    this.accessComplianceChart = {
      series: [summary.security.accessControlCompliancePercent],
      chart: { type: 'radialBar', height: 300 },
      labels: ['Cumplimiento de Acceso'],
      colors: ['#22c55e'],
      plotOptions: {
        radialBar: {
          hollow: { size: '65%' },
          dataLabels: {
            name: { fontSize: '14px' },
            value: {
              fontSize: '24px',
              formatter: (val: number) => `${Math.round(val)}%`,
            },
          },
        },
      },
      stroke: { lineCap: 'round' },
    };

    this.inventoryTopSellingChart = {
      series: [
        {
          name: 'Unidades vendidas',
          data: this.inventoryTopSelling().map((item) => item.unitsSold),
        },
      ],
      chart: { type: 'bar', height: 360, toolbar: { show: true } },
      plotOptions: {
        bar: {
          borderRadius: 8,
          horizontal: true,
          barHeight: '70%',
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: this.inventoryTopSelling().map((item) => `${item.savCode} - ${item.spareName}`),
      },
      colors: ['#0ea5e9'],
      grid: { borderColor: '#e2e8f0' },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} unidades`,
        },
      },
    };

    this.inventoryStagnantChart = {
      series: [
        {
          name: 'Días sin venta',
          data: this.inventoryStagnant().map((item) => item.daysWithoutSales ?? 0),
        },
      ],
      chart: { type: 'bar', height: 360, toolbar: { show: true } },
      plotOptions: {
        bar: {
          borderRadius: 8,
          distributed: true,
          columnWidth: '55%',
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: this.inventoryStagnant().map((item) => item.savCode),
      },
      colors: ['#f97316', '#fb7185', '#facc15', '#a855f7', '#06b6d4', '#84cc16'],
      grid: { borderColor: '#e2e8f0' },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} días`,
        },
      },
    };

    this.inventoryProfitChart = {
      series: [
        {
          name: 'Valor monetario',
          data: [profit.grossSalesAmount, profit.estimatedProfitAmount],
        },
      ],
      chart: { type: 'bar', height: 300, toolbar: { show: false } },
      plotOptions: {
        bar: {
          borderRadius: 8,
          distributed: true,
          columnWidth: '45%',
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => this.formatMoney(Number(val)),
      },
      xaxis: {
        categories: ['Ventas brutas', 'Ganancia estimada'],
      },
      colors: ['#2563eb', '#16a34a'],
      yaxis: {
        labels: {
          formatter: (val: number) => this.formatMoney(Number(val)),
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => this.formatMoney(Number(val)),
        },
      },
    };

    this.thresholdChart = {
      series: [belowThreshold.belowThresholdPercent],
      chart: { type: 'radialBar', height: 300 },
      labels: ['Stock bajo umbral'],
      colors: ['#dc2626'],
      plotOptions: {
        radialBar: {
          hollow: { size: '62%' },
          dataLabels: {
            value: {
              fontSize: '24px',
              formatter: (val: number) => `${Math.round(val)}%`,
            },
          },
        },
      },
    };

    this.appointmentsChart = {
      series: [summary.appointments.successfulAppointments, summary.appointments.rejectedByBusinessRules],
      chart: { type: 'donut', height: 320 },
      labels: ['Exitosas', 'Rechazadas por reglas'],
      colors: ['#10b981', '#ef4444'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true },
      stroke: { width: 2 },
    };

    this.maintainabilityChart = {
      series: [
        {
          name: 'Estructura',
          data: [
            summary.maintainability.totalControllers,
            summary.maintainability.totalServices,
            summary.maintainability.totalRepositories,
            summary.maintainability.jacocoCoverageGatePercent,
          ],
        },
      ],
      chart: { type: 'radar', height: 320 },
      xaxis: {
        categories: ['Controladores', 'Servicios', 'Repositorios', 'JaCoCo Gate %'],
      },
      stroke: { width: 2 },
      fill: { opacity: 0.25 },
      colors: ['#7c3aed'],
      tooltip: {
        y: {
          formatter: (val: number) => String(Math.round(Number(val))),
        },
      },
    };

    this.performanceChart = {
      series: [
        {
          name: 'Promedio (ms)',
          type: 'column',
          data: summary.performance.map((item) => item.avgResponseTimeMs),
        },
        {
          name: 'Cumplimiento %',
          type: 'line',
          data: summary.performance.map((item) => item.compliancePercent),
        },
      ],
      chart: { type: 'line', height: 380, stacked: false, toolbar: { show: true } },
      dataLabels: { enabled: false },
      stroke: { width: [0, 3] },
      xaxis: {
        categories: summary.performance.map((item) => this.getPerformanceEndpointLabel(item.endpoint)),
      },
      yaxis: [
        {
          title: { text: 'Milisegundos' },
        },
        {
          opposite: true,
          min: 0,
          max: 100,
          title: { text: 'Cumplimiento %' },
        },
      ],
      colors: ['#2563eb', '#22c55e'],
      grid: { borderColor: '#e2e8f0' },
      tooltip: {
        shared: true,
        intersect: false,
      },
    };
  }

  private getTodayDate(): string {
    return this.formatDateLocal(new Date());
  }

  private getMonthStartDate(): string {
    const date = new Date();
    date.setDate(1);
    return this.formatDateLocal(date);
  }

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private shortenEndpoint(endpoint: string): string {
    if (endpoint.length <= 28) {
      return endpoint;
    }
    return `${endpoint.slice(0, 26)}...`;
  }

  private getPerformanceEndpointLabel(endpoint: string): string {
    const normalized = endpoint.toLowerCase().trim();

    if (normalized.includes('/api/auth/login')) {
      return 'Inicio de Sesion';
    }

    if (normalized.includes('/api/verify-2fa') || normalized.includes('/verify-2fa')) {
      return 'Verificacion 2FA';
    }

    return this.shortenEndpoint(endpoint);
  }
}
