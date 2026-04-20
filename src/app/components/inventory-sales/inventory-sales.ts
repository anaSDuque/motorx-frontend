import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import { SpareService } from '../../services/spare.service';
import {
  SaleTransactionResponseDTO,
  DailySalesSummaryDTO,
  CreateSaleTransactionDTO,
} from '../../models';
import { SpareResponseDTO } from '../../models';

@Component({
  selector: 'app-inventory-sales',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './inventory-sales.html',
  styleUrl: './inventory-sales.css',
})
export class InventorySales implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryTransactionService);
  private readonly spareService = inject(SpareService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly sales = signal<SaleTransactionResponseDTO[]>([]);
  protected readonly dailySummary = signal<DailySalesSummaryDTO | null>(null);
  protected readonly spares = signal<SpareResponseDTO[]>([]);

  protected readonly creating = signal(false);

  protected readonly saleForm = this.fb.group({
    appointmentId: [null as number | null],
    items: this.fb.array([this.createItemGroup()]),
  });

  protected get totalItemsSoldToday(): number {
    const summary = this.dailySummary();
    if (!summary?.sales?.length) return 0;
    return summary.sales.reduce(
      (saleAcc, sale) => saleAcc + sale.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0),
      0
    );
  }

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

  protected get items(): FormArray {
    return this.saleForm.controls.items as FormArray;
  }

  protected getItemGroup(index: number): FormGroup {
    return this.items.at(index) as FormGroup;
  }

  protected addItem(): void {
    this.items.push(this.createItemGroup());
  }

  protected removeItem(index: number): void {
    if (this.items.length === 1) return;
    this.items.removeAt(index);
  }

  protected createSale(): void {
    this.saleForm.markAllAsTouched();
    if (this.saleForm.invalid || this.items.length === 0) {
      this.error.set('Revisa los campos del formulario antes de registrar la venta.');
      return;
    }

    const raw = this.saleForm.getRawValue();
    const appointmentId = raw.appointmentId;

    if (appointmentId !== null && appointmentId !== undefined && Number(appointmentId) < 1) {
      this.error.set('El ID de cita debe ser mayor a cero.');
      return;
    }

    const dto: CreateSaleTransactionDTO = {
      appointmentId: appointmentId ? Number(appointmentId) : null,
      items: raw.items.map((item) => ({
        spareId: Number(item["spareId"]),
        quantity: item["quantity"],
      })),
    };

    this.creating.set(true);
    this.error.set('');

    this.inventoryService.createSale(dto).subscribe({
      next: () => {
        this.creating.set(false);
        this.success.set('Venta registrada exitosamente');
        this.saleForm.reset({ appointmentId: null });
        this.items.clear();
        this.items.push(this.createItemGroup());
        this.loadData();
      },
      error: (err) => {
        this.creating.set(false);
        this.error.set(err.error?.message ?? 'Error al registrar venta');
      },
    });
  }

  protected hasError(index: number, controlName: 'spareId' | 'quantity', errorName: string): boolean {
    const control = this.getItemGroup(index).get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      spareId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });
  }
}
