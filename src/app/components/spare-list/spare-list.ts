import { Component, OnInit, inject, signal } from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SpareService } from '../../services/spare.service';
import { AuthService } from '../../services/auth.service';
import {
  CreateSpareDTO,
  SpareFiltersDTO,
  UpdateSpareDTO,
  SpareResponseDTO,
  Role,
} from '../../models';

@Component({
  selector: 'app-spare-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './spare-list.html',
  styleUrl: './spare-list.css',
})
export class SpareList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly spareService = inject(SpareService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly spares = signal<SpareResponseDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly notifyingRestockId = signal<number | null>(null);
  protected readonly restockFeedbackBySpareId = signal<Record<number, { type: 'success' | 'error'; message: string }>>({});

  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formLoading = signal(false);
  protected readonly formError = signal('');
  protected readonly onlyBelowThreshold = signal(false);
  protected readonly warehouseSegments = signal<string[]>(['00', '00', '00', '00']);
  protected readonly compatibleMotorcycleLines = signal<string[]>(['']);
  protected readonly searchForm = this.fb.nonNullable.group({
    name: [''],
    savCode: [''],
  });

  protected readonly spareForm = this.fb.nonNullable.group({
    savCode: ['', [Validators.required, Validators.maxLength(100)]],
    spareCode: ['', [Validators.required, Validators.maxLength(100)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    supplier: ['', [Validators.required, Validators.maxLength(150)]],
    compatibleMotorcycles: ['', [Validators.required, Validators.maxLength(500)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    purchasePriceWithVat: [0, [Validators.required, Validators.min(0)]],
    isOil: [false],
    warehouseLocation: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{2}-\d{2}-\d{2}$/)]],
    stockThreshold: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.onlyBelowThreshold.set(params.get('belowThreshold') === 'true');
      this.loadSpares();
    });
  }

  protected get isAdmin(): boolean {
    return this.authService.getStoredRole() === Role.ADMIN;
  }

  protected get isWarehouseWorker(): boolean {
    return this.authService.getStoredRole() === Role.WARE_HOUSE_WORKER;
  }

  protected loadSpares(): void {
    this.loading.set(true);
    this.error.set('');

    const filters = this.buildSearchFilters();
    const request$ = this.onlyBelowThreshold()
      ? this.spareService.getSparesBelowThreshold()
      : this.spareService.getSpares(filters);

    request$.subscribe({
      next: (data) => {
        this.spares.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar repuestos');
        this.loading.set(false);
      },
    });
  }

  protected applyFilters(): void {
    if (this.onlyBelowThreshold()) return;
    this.loadSpares();
  }

  protected clearFilters(): void {
    if (this.onlyBelowThreshold()) return;

    this.searchForm.reset({
      name: '',
      savCode: '',
    });

    this.loadSpares();
  }

  protected hasActiveFilters(): boolean {
    const raw = this.searchForm.getRawValue();
    return !!raw.name.trim() || !!raw.savCode.trim();
  }

  protected openCreateForm(): void {
    this.resetForm();
    this.editingId.set(null);
    this.setWarehouseFromString('00-00-00-00');
    this.compatibleMotorcycleLines.set(['']);
    this.showForm.set(true);
  }

  protected openEditForm(spare: SpareResponseDTO): void {
    this.editingId.set(spare.id);
    const compatibleFromSpare = (spare.compatibleMotorcycles ?? '')
      .split(',')
      .map((line) => line.trim())
      .filter((line) => !!line);

    this.spareForm.patchValue({
      savCode: spare.savCode,
      spareCode: spare.spareCode,
      name: spare.name,
      supplier: spare.supplier ?? '',
      compatibleMotorcycles: (spare.compatibleMotorcycles ?? '').trim(),
      quantity: spare.quantity,
      purchasePriceWithVat: spare.purchasePriceWithVat,
      isOil: spare.isOil,
      warehouseLocation: spare.warehouseLocation,
      stockThreshold: spare.stockThreshold,
    });
    this.setWarehouseFromString(spare.warehouseLocation);
    this.compatibleMotorcycleLines.set(compatibleFromSpare.length > 0 ? compatibleFromSpare : ['']);
    this.formError.set('');
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.resetForm();
  }

  protected onSubmit(): void {
    this.syncCompatibleMotorcyclesControl();
    this.spareForm.controls.warehouseLocation.setValue(this.currentWarehouseLocation, { emitEvent: false });
    this.spareForm.markAllAsTouched();
    if (this.spareForm.invalid) {
      this.formError.set('Completa correctamente los campos requeridos.');
      return;
    }

    const raw = this.spareForm.getRawValue();
    const normalized = {
      savCode: raw.savCode.trim(),
      spareCode: raw.spareCode.trim(),
      name: raw.name.trim(),
      supplier: raw.supplier.trim(),
      compatibleMotorcycles: raw.compatibleMotorcycles.trim(),
      quantity: raw.quantity,
      purchasePriceWithVat: raw.purchasePriceWithVat,
      isOil: raw.isOil,
      warehouseLocation: this.currentWarehouseLocation,
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
      this.formError.set('No se permiten campos en blanco.');
      return;
    }

    if (!/^\d{2}-\d{2}-\d{2}-\d{2}$/.test(normalized.warehouseLocation)) {
      this.formError.set('La ubicación de bodega debe tener formato 00-00-00-00.');
      return;
    }

    if (
      normalized.quantity < 0 ||
      !Number.isInteger(normalized.quantity) ||
      normalized.purchasePriceWithVat < 0 ||
      normalized.stockThreshold < 0 ||
      !Number.isInteger(normalized.stockThreshold)
    ) {
      this.formError.set('Cantidad y umbral deben ser enteros positivos; el precio no puede ser negativo.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');

    if (this.editingId()) {
      const dto: UpdateSpareDTO = {
        savCode: normalized.savCode,
        spareCode: normalized.spareCode,
        name: normalized.name,
        supplier: normalized.supplier,
        compatibleMotorcycles: normalized.compatibleMotorcycles,
        quantity: normalized.quantity,
        purchasePriceWithVat: normalized.purchasePriceWithVat,
        isOil: normalized.isOil,
        warehouseLocation: normalized.warehouseLocation,
        stockThreshold: normalized.stockThreshold,
      };

      this.spareService.updateSpare(this.editingId()!, dto).subscribe({
        next: () => {
          this.formLoading.set(false);
          this.showForm.set(false);
          this.success.set('Repuesto actualizado exitosamente');
          this.loadSpares();
        },
        error: (err) => {
          this.formLoading.set(false);
          this.formError.set(err.error?.message ?? 'Error al actualizar repuesto');
        },
      });
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

    this.spareService.createSpare(dto).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.showForm.set(false);
        this.success.set('Repuesto creado exitosamente');
        this.loadSpares();
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(this.extractApiErrorMessage(err, 'Error al crear repuesto'));
      },
    });
  }

  protected addCompatibleMotorcycleLine(): void {
    this.compatibleMotorcycleLines.update((lines) => [...lines, '']);
  }

  protected removeCompatibleMotorcycleLine(index: number): void {
    this.compatibleMotorcycleLines.update((lines) => {
      if (lines.length <= 1) {
        return [''];
      }
      return lines.filter((_, lineIndex) => lineIndex !== index);
    });
    this.syncCompatibleMotorcyclesControl();
  }

  protected updateCompatibleMotorcycleLine(index: number, value: string): void {
    this.compatibleMotorcycleLines.update((lines) => lines.map((line, lineIndex) => (lineIndex === index ? value : line)));
    this.syncCompatibleMotorcyclesControl();
  }

  protected onWarehouseSegmentInput(index: number, value: string): void {
    const clean = value.replace(/\D/g, '').slice(0, 2);
    this.warehouseSegments.update((segments) =>
      segments.map((segment, segmentIndex) => (segmentIndex === index ? clean : segment))
    );
    this.spareForm.controls.warehouseLocation.setValue(this.currentWarehouseLocation, { emitEvent: false });
  }

  protected onWarehouseSegmentBlur(index: number): void {
    this.warehouseSegments.update((segments) =>
      segments.map((segment, segmentIndex) => {
        if (segmentIndex !== index) {
          return segment;
        }
        if (!segment) {
          return '00';
        }
        return segment.padStart(2, '0').slice(-2);
      })
    );
    this.spareForm.controls.warehouseLocation.setValue(this.currentWarehouseLocation, { emitEvent: false });
  }

  protected get currentWarehouseLocation(): string {
    return this.warehouseSegments().map((segment) => segment.padStart(2, '0').slice(-2)).join('-');
  }

  protected warehouseLocationInvalid(): boolean {
    return !/^\d{2}-\d{2}-\d{2}-\d{2}$/.test(this.currentWarehouseLocation);
  }

  protected updatePurchasePrice(spare: SpareResponseDTO): void {
    const newPriceRaw = prompt(
      `Nuevo precio de compra para ${spare.name} (${spare.spareCode})`,
      String(spare.purchasePriceWithVat)
    );

    if (!newPriceRaw) return;
    const newPrice = Number(newPriceRaw);
    if (Number.isNaN(newPrice) || newPrice < 0) {
      this.error.set('Precio inválido');
      return;
    }

    this.spareService
      .updatePurchasePrice(spare.id, { purchasePriceWithVat: newPrice })
      .subscribe({
        next: () => {
          this.success.set('Precio de compra actualizado');
          this.loadSpares();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? 'Error al actualizar precio');
        },
      });
  }

  protected deleteSpare(id: number): void {
    if (!this.isAdmin) return;
    if (!confirm('¿Eliminar este repuesto?')) return;

    this.spareService.deleteSpare(id).subscribe({
      next: () => {
        this.success.set('Repuesto eliminado exitosamente');
        this.loadSpares();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al eliminar repuesto');
      },
    });
  }

  protected notifyRestock(spare: SpareResponseDTO): void {
    if (!this.isAdmin) return;

    this.notifyingRestockId.set(spare.id);
    this.error.set('');
    this.success.set('');
    this.restockFeedbackBySpareId.update((feedback) => {
      const next = { ...feedback };
      delete next[spare.id];
      return next;
    });

    this.spareService.notifyRestock(spare.id).subscribe({
      next: (res) => {
        const message = (res?.message ?? 'Notificación de surtido enviada').trim();
        this.success.set(message);
        this.restockFeedbackBySpareId.update((feedback) => ({
          ...feedback,
          [spare.id]: { type: 'success', message },
        }));
        this.notifyingRestockId.set(null);
      },
      error: (err) => {
        const message = err.error?.message ?? 'Error al notificar surtido';
        this.error.set(message);
        this.restockFeedbackBySpareId.update((feedback) => ({
          ...feedback,
          [spare.id]: { type: 'error', message },
        }));
        this.notifyingRestockId.set(null);
      },
    });
  }

  protected isNotifyingRestock(spareId: number): boolean {
    return this.notifyingRestockId() === spareId;
  }

  protected getRestockFeedback(spareId: number): { type: 'success' | 'error'; message: string } | null {
    return this.restockFeedbackBySpareId()[spareId] ?? null;
  }

  protected hasError(controlName: keyof typeof this.spareForm.controls, errorName: string): boolean {
    const control = this.spareForm.controls[controlName];
    return control.touched && control.hasError(errorName);
  }

  protected hasCompatibleMotorcyclesError(): boolean {
    const control = this.spareForm.controls.compatibleMotorcycles;
    return control.touched && control.invalid;
  }

  private buildSearchFilters(): SpareFiltersDTO | undefined {
    const raw = this.searchForm.getRawValue();
    const name = raw.name.trim();
    const savCode = raw.savCode.trim();

    if (!name && !savCode) {
      return undefined;
    }

    return {
      name: name || undefined,
      savCode: savCode || undefined,
    };
  }

  private resetForm(): void {
    this.spareForm.reset({
      savCode: '',
      spareCode: '',
      name: '',
      supplier: '',
      compatibleMotorcycles: '',
      quantity: 0,
      purchasePriceWithVat: 0,
      isOil: false,
      warehouseLocation: '00-00-00-00',
      stockThreshold: 0,
    });
    this.setWarehouseFromString('00-00-00-00');
    this.compatibleMotorcycleLines.set(['']);
    this.formError.set('');
  }

  private setWarehouseFromString(location: string): void {
    const parts = (location || '').split('-').map((segment) => segment.replace(/\D/g, '').slice(0, 2));
    const normalized = [0, 1, 2, 3].map((index) => (parts[index] ?? '00').padStart(2, '0').slice(-2));
    this.warehouseSegments.set(normalized);
    this.spareForm.controls.warehouseLocation.setValue(normalized.join('-'), { emitEvent: false });
  }

  private syncCompatibleMotorcyclesControl(): void {
    const compatible = this.compatibleMotorcycleLines()
      .map((line) => line.trim())
      .filter((line) => !!line)
      .join(', ');

    this.spareForm.controls.compatibleMotorcycles.setValue(compatible, { emitEvent: false });
    this.spareForm.controls.compatibleMotorcycles.updateValueAndValidity({ emitEvent: false });
  }

  private extractApiErrorMessage(error: any, fallback: string): string {
    const backend = error?.error;
    const message = typeof backend?.message === 'string' ? backend.message.trim() : '';

    if (Array.isArray(backend?.details)) {
      const details = backend.details
        .map((item: unknown) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') {
            return Object.values(item as Record<string, unknown>).map(String).join(': ');
          }
          return '';
        })
        .filter((detail: string) => !!detail)
        .join(', ');
      if (message && details) return `${message}: ${details}`;
      if (details) return details;
    }

    if (backend?.details && typeof backend.details === 'object') {
      const details = Object.values(backend.details as Record<string, unknown>).map(String).join(', ');
      if (message && details) return `${message}: ${details}`;
      if (details) return details;
    }

    if (message) return message;
    return fallback;
  }
}
