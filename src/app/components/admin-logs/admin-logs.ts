import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminLogService } from '../../services/admin-log.service';
import { LogPageResponseDTO } from '../../models/log.model';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './admin-logs.html',
  styleUrl: './admin-logs.css',
})
export class AdminLogs implements OnInit {
  private readonly logService = inject(AdminLogService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly pageData = signal<LogPageResponseDTO | null>(null);
  protected readonly pageSize = signal(20);

  ngOnInit(): void {
    this.loadLogs(0);
  }

  protected loadLogs(page: number): void {
    this.loading.set(true);
    this.error.set('');

    this.logService.getLogs(page, this.pageSize()).subscribe({
      next: (res) => {
        this.pageData.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar logs');
        this.loading.set(false);
      },
    });
  }

  protected onPageSizeChange(value: number): void {
    this.pageSize.set(Number(value));
    this.loadLogs(0);
  }

  protected nextPage(): void {
    const current = this.pageData();
    if (!current || current.last) return;
    this.loadLogs(current.page + 1);
  }

  protected prevPage(): void {
    const current = this.pageData();
    if (!current || current.first) return;
    this.loadLogs(current.page - 1);
  }
}
