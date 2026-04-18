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
  PurchaseTransactionResponseDTO,
  CreatePurchaseTransactionDTO,
} from '../../models/inventory.model';
import { SpareResponseDTO } from '../../models/spare.model';

@Component({
  selector: 'app-inventory-purchases',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './inventory-purchases.html',
  styleUrl: './inventory-purchases.css',
})
export class InventoryPurchases implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryTransactionService);
  private readonly spareService = inject(SpareService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly purchases = signal<PurchaseTransactionResponseDTO[]>([]);
  protected readonly spares = signal<SpareResponseDTO[]>([]);

  protected readonly creating = signal(false);

  protected readonly purchaseForm = this.fb.group({
    notes: [''],
    items: this.fb.array([this.createItemGroup()]),
  });

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

  protected get items(): FormArray {
    return this.purchaseForm.controls.items as FormArray;
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

  protected createPurchase(): void {
    this.purchaseForm.markAllAsTouched();
    if (this.purchaseForm.invalid || this.items.length === 0) {
      this.error.set('Revisa los campos del formulario antes de registrar la compra.');
      return;
    }

    const raw = this.purchaseForm.getRawValue();
    const normalizedNotes = raw.notes?.trim();

    const dto: CreatePurchaseTransactionDTO = {
      notes: normalizedNotes ? normalizedNotes : undefined,
      items: raw.items.map((item) => ({
        spareId: Number(item["spareId"]),
        quantity: item["quantity"],
        purchasePriceWithVat: item["purchasePriceWithVat"],
      })),
    };

    this.creating.set(true);
    this.error.set('');

    this.inventoryService.createPurchase(dto).subscribe({
      next: () => {
        this.creating.set(false);
        this.success.set('Compra registrada exitosamente');
        this.purchaseForm.reset({ notes: '' });
        this.items.clear();
        this.items.push(this.createItemGroup());
        this.loadData();
      },
      error: (err) => {
        this.creating.set(false);
        this.error.set(err.error?.message ?? 'Error al registrar compra');
      },
    });
  }

  protected hasError(index: number, controlName: 'spareId' | 'quantity' | 'purchasePriceWithVat', errorName: string): boolean {
    const control = this.getItemGroup(index).get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      spareId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      purchasePriceWithVat: [0, [Validators.required, Validators.min(0)]],
    });
  }
}
