import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import { SpareService } from '../../services/spare.service';
import {
  SaleTransactionResponseDTO,
  DailySalesSummaryDTO,
  CreateSaleTransactionDTO,
} from '../../models/inventory.model';
import { SpareResponseDTO } from '../../models/spare.model';

interface SaleFormItem {
  spareId: number | null;
  quantity: number;
}

@Component({
  selector: 'app-inventory-sales',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './inventory-sales.html',
  styleUrl: './inventory-sales.css',
})
export class InventorySales implements OnInit {
  private readonly inventoryService = inject(InventoryTransactionService);
  private readonly spareService = inject(SpareService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly sales = signal<SaleTransactionResponseDTO[]>([]);
  protected readonly dailySummary = signal<DailySalesSummaryDTO | null>(null);
  protected readonly spares = signal<SpareResponseDTO[]>([]);

  protected readonly creating = signal(false);
  protected readonly appointmentId = signal<number | null>(null);
  protected readonly notes = signal('');
  protected readonly items = signal<SaleFormItem[]>([{ spareId: null, quantity: 1 }]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    this.inventoryService.getSales().subscribe({
      next: (data) => {
        this.sales.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar ventas');
        this.loading.set(false);
      },
    });

    this.inventoryService.getSalesToday().subscribe({
      next: (data) => this.dailySummary.set(data),
      error: () => this.dailySummary.set(null),
    });

    this.spareService.getSpares().subscribe({
      next: (data) => this.spares.set(data),
      error: () => {},
    });
  }

  protected addItem(): void {
    this.items.update((value) => [...value, { spareId: null, quantity: 1 }]);
  }

  protected removeItem(index: number): void {
    this.items.update((value) => value.filter((_, i) => i !== index));
  }

  protected updateItem(index: number, patch: Partial<SaleFormItem>): void {
    this.items.update((value) =>
      value.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  protected createSale(): void {
    const normalizedItems = this.items().filter((item) => item.spareId && item.quantity > 0);

    if (normalizedItems.length === 0) {
      this.error.set('Agrega al menos un item válido');
      return;
    }

    const dto: CreateSaleTransactionDTO = {
      appointmentId: this.appointmentId(),
      notes: this.notes() || undefined,
      items: normalizedItems.map((item) => ({
        spareId: item.spareId!,
        quantity: item.quantity,
      })),
    };

    this.creating.set(true);
    this.error.set('');

    this.inventoryService.createSale(dto).subscribe({
      next: () => {
        this.creating.set(false);
        this.success.set('Venta registrada exitosamente');
        this.appointmentId.set(null);
        this.notes.set('');
        this.items.set([{ spareId: null, quantity: 1 }]);
        this.loadData();
      },
      error: (err) => {
        this.creating.set(false);
        this.error.set(err.error?.message ?? 'Error al registrar venta');
      },
    });
  }
}
