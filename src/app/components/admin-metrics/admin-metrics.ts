import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminMetricsService } from '../../services/admin-metrics.service';
import { MetricsSummaryDTO } from '../../models/metrics.model';

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [],
  templateUrl: './admin-metrics.html',
  styleUrl: './admin-metrics.css',
})
export class AdminMetrics implements OnInit {
  private readonly metricsService = inject(AdminMetricsService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly summary = signal<MetricsSummaryDTO | null>(null);

  ngOnInit(): void {
    this.loadSummary();
  }

  protected loadSummary(): void {
    this.loading.set(true);
    this.error.set('');

    this.metricsService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar métricas');
        this.loading.set(false);
      },
    });
  }
}
