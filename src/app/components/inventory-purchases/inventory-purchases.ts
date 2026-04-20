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
import { CreateSpareDTO, SpareResponseDTO } from '../../models/spare.model';

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
  protected readonly showCreateSpareModal = signal(false);
  protected readonly creatingSpare = signal(false);
  protected readonly spareFormError = signal('');

  protected readonly purchaseForm = this.fb.group({
    supplier: ['', [Validators.required, Validators.maxLength(150)]],
    items: this.fb.array([this.createItemGroup()]),
  });

  protected readonly spareForm = this.fb.nonNullable.group({
    savCode: ['', [Validators.required, Validators.maxLength(100)]],
    spareCode: ['', [Validators.required, Validators.maxLength(100)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    supplier: ['', [Validators.required, Validators.maxLength(150)]],
    compatibleMotorcycles: ['', [Validators.required, Validators.maxLength(500)]],
    description: ['', [Validators.maxLength(500)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    purchasePriceWithVat: [0, [Validators.required, Validators.min(0)]],
    isOil: [false],
    warehouseLocation: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{2}-\d{2}-\d{2}$/)]],
    stockThreshold: [0, [Validators.required, Validators.min(0)]],
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

    this.loadSpares();
  }

  private loadSpares(): void {
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
    const normalizedSupplier = raw.supplier?.trim();

    if (!normalizedSupplier) {
      this.error.set('El proveedor es obligatorio.');
      return;
    }

    const dto: CreatePurchaseTransactionDTO = {
      supplier: normalizedSupplier,
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
        this.purchaseForm.reset({ supplier: '' });
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

  protected openCreateSpareModal(): void {
    this.resetSpareForm();
    this.spareForm.controls.warehouseLocation.setValue('00-00-00-00');
    this.showCreateSpareModal.set(true);
  }

  protected closeCreateSpareModal(): void {
    this.showCreateSpareModal.set(false);
    this.resetSpareForm();
  }

  protected createSpareFromPurchase(): void {
    this.spareForm.markAllAsTouched();
    if (this.spareForm.invalid) {
      this.spareFormError.set('Completa correctamente los campos requeridos.');
      return;
    }

    const raw = this.spareForm.getRawValue();
    const normalized = {
      savCode: raw.savCode.trim(),
      spareCode: raw.spareCode.trim(),
      name: raw.name.trim(),
      supplier: raw.supplier.trim(),
      compatibleMotorcycles: raw.compatibleMotorcycles.trim(),
      description: raw.description.trim(),
      quantity: raw.quantity,
      purchasePriceWithVat: raw.purchasePriceWithVat,
      isOil: raw.isOil,
      warehouseLocation: raw.warehouseLocation.trim(),
      stockThreshold: raw.stockThreshold,
    };

    if (
      !normalized.savCode ||
      !normalized.spareCode ||
      !normalized.name ||
      !normalized.supplier ||
      !normalized.compatibleMotorcycles ||
      !normalized.warehouseLocation
    ) {
      this.spareFormError.set('No se permiten campos en blanco.');
      return;
    }

    const dto: CreateSpareDTO = {
      name: normalized.name,
      compatibleMotorcycles: normalized.compatibleMotorcycles,
      savCode: normalized.savCode,
      spareCode: normalized.spareCode,
      supplier: normalized.supplier,
      quantity: normalized.quantity,
      purchasePriceWithVat: normalized.purchasePriceWithVat,
      isOil: normalized.isOil,
      stockThreshold: normalized.stockThreshold,
      warehouseLocation: normalized.warehouseLocation,
    };

    this.creatingSpare.set(true);
    this.spareFormError.set('');

    this.spareService.createSpare(dto).subscribe({
      next: (createdSpare) => {
        this.creatingSpare.set(false);
        this.success.set('Repuesto creado exitosamente');
        this.closeCreateSpareModal();
        this.loadSpares();

        const firstEmptyItem = this.items.controls.find((control) => !control.get('spareId')?.value);
        if (firstEmptyItem) {
          firstEmptyItem.get('spareId')?.setValue(createdSpare.id);
        }
      },
      error: (err) => {
        this.creatingSpare.set(false);
        this.spareFormError.set(err.error?.message ?? 'Error al crear repuesto');
      },
    });
  }

  protected hasError(index: number, controlName: 'spareId' | 'quantity' | 'purchasePriceWithVat', errorName: string): boolean {
    const control = this.getItemGroup(index).get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  protected hasSpareFormError(
    controlName: keyof typeof this.spareForm.controls,
    errorName: string
  ): boolean {
    const control = this.spareForm.controls[controlName];
    return control.touched && control.hasError(errorName);
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      spareId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      purchasePriceWithVat: [0, [Validators.required, Validators.min(0)]],
    });
  }

  private resetSpareForm(): void {
    this.spareForm.reset({
      savCode: '',
      spareCode: '',
      name: '',
      supplier: '',
      compatibleMotorcycles: '',
      description: '',
      quantity: 0,
      purchasePriceWithVat: 0,
      isOil: false,
      warehouseLocation: '00-00-00-00',
      stockThreshold: 0,
    });
    this.spareFormError.set('');
  }
}
