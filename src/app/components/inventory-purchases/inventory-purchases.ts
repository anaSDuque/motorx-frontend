import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import { SpareService } from '../../services/spare.service';
import {
  PurchaseTransactionResponseDTO,
  CreatePurchaseTransactionDTO,
} from '../../models/inventory.model';
import { SpareResponseDTO } from '../../models/spare.model';

interface PurchaseFormItem {
  spareId: number | null;
  quantity: number;
  purchasePriceWithVat: number;
}

@Component({
  selector: 'app-inventory-purchases',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './inventory-purchases.html',
  styleUrl: './inventory-purchases.css',
})
export class InventoryPurchases implements OnInit {
  private readonly inventoryService = inject(InventoryTransactionService);
  private readonly spareService = inject(SpareService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly purchases = signal<PurchaseTransactionResponseDTO[]>([]);
  protected readonly spares = signal<SpareResponseDTO[]>([]);

  protected readonly notes = signal('');
  protected readonly creating = signal(false);
  protected readonly items = signal<PurchaseFormItem[]>([
    { spareId: null, quantity: 1, purchasePriceWithVat: 0 },
  ]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    this.inventoryService.getPurchases().subscribe({
      next: (data) => {
        this.purchases.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar compras');
        this.loading.set(false);
      },
    });

    this.spareService.getSpares().subscribe({
      next: (data) => this.spares.set(data),
      error: () => {},
    });
  }

  protected addItem(): void {
    this.items.update((value) => [
      ...value,
      { spareId: null, quantity: 1, purchasePriceWithVat: 0 },
    ]);
  }

  protected removeItem(index: number): void {
    this.items.update((value) => value.filter((_, i) => i !== index));
  }

  protected updateItem(index: number, patch: Partial<PurchaseFormItem>): void {
    this.items.update((value) =>
      value.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  protected createPurchase(): void {
    const normalizedItems = this.items().filter((item) => item.spareId && item.quantity > 0);

    if (normalizedItems.length === 0) {
      this.error.set('Agrega al menos un item válido');
      return;
    }

    const dto: CreatePurchaseTransactionDTO = {
      notes: this.notes() || undefined,
      items: normalizedItems.map((item) => ({
        spareId: item.spareId!,
        quantity: item.quantity,
        purchasePriceWithVat: item.purchasePriceWithVat,
      })),
    };

    this.creating.set(true);
    this.error.set('');

    this.inventoryService.createPurchase(dto).subscribe({
      next: () => {
        this.creating.set(false);
        this.success.set('Compra registrada exitosamente');
        this.notes.set('');
        this.items.set([{ spareId: null, quantity: 1, purchasePriceWithVat: 0 }]);
        this.loadData();
      },
      error: (err) => {
        this.creating.set(false);
        this.error.set(err.error?.message ?? 'Error al registrar compra');
      },
    });
  }
}
