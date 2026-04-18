import { Component, OnInit, inject, signal } from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SpareService } from '../../services/spare.service';
import { AuthService } from '../../services/auth.service';
import {
  CreateSpareDTO,
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

  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formLoading = signal(false);
  protected readonly formError = signal('');
  protected readonly onlyBelowThreshold = signal(false);

  protected readonly spareForm = this.fb.nonNullable.group({
    savCode: ['', [Validators.required, Validators.maxLength(100)]],
    spareCode: ['', [Validators.required, Validators.maxLength(100)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(500)]],
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
    const request$ = this.onlyBelowThreshold()
      ? this.spareService.getSparesBelowThreshold()
      : this.spareService.getSpares();

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

  protected openCreateForm(): void {
    this.resetForm();
    this.editingId.set(null);
    this.spareForm.controls.warehouseLocation.setValue('00-00-00-00');
    this.showForm.set(true);
  }

  protected openEditForm(spare: SpareResponseDTO): void {
    this.editingId.set(spare.id);
    this.spareForm.patchValue({
      savCode: spare.savCode,
      spareCode: spare.spareCode,
      name: spare.name,
      description: spare.description ?? '',
      quantity: spare.quantity,
      purchasePriceWithVat: spare.purchasePriceWithVat,
      isOil: spare.isOil,
      warehouseLocation: spare.warehouseLocation,
      stockThreshold: spare.stockThreshold,
    });
    this.formError.set('');
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.resetForm();
  }

  protected onSubmit(): void {
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
      description: raw.description.trim(),
      quantity: raw.quantity,
      purchasePriceWithVat: raw.purchasePriceWithVat,
      isOil: raw.isOil,
      warehouseLocation: raw.warehouseLocation.trim(),
      stockThreshold: raw.stockThreshold,
    };

    if (!normalized.savCode || !normalized.spareCode || !normalized.name || !normalized.warehouseLocation) {
      this.formError.set('No se permiten campos en blanco.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');

    if (this.editingId()) {
      const dto: UpdateSpareDTO = {
        savCode: normalized.savCode,
        spareCode: normalized.spareCode,
        name: normalized.name,
        description: normalized.description || undefined,
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
      savCode: normalized.savCode,
      spareCode: normalized.spareCode,
      name: normalized.name,
      description: normalized.description || undefined,
      quantity: normalized.quantity,
      purchasePriceWithVat: normalized.purchasePriceWithVat,
      isOil: normalized.isOil,
      warehouseLocation: normalized.warehouseLocation,
      stockThreshold: normalized.stockThreshold,
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
        this.formError.set(err.error?.message ?? 'Error al crear repuesto');
      },
    });
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

    this.spareService.notifyRestock(spare.id).subscribe({
      next: (res) => this.success.set(res.message || 'Notificación de surtido enviada'),
      error: (err) => this.error.set(err.error?.message ?? 'Error al notificar surtido'),
    });
  }

  protected hasError(controlName: keyof typeof this.spareForm.controls, errorName: string): boolean {
    const control = this.spareForm.controls[controlName];
    return control.touched && control.hasError(errorName);
  }

  private resetForm(): void {
    this.spareForm.reset({
      savCode: '',
      spareCode: '',
      name: '',
      description: '',
      quantity: 0,
      purchasePriceWithVat: 0,
      isOil: false,
      warehouseLocation: '00-00-00-00',
      stockThreshold: 0,
    });
    this.formError.set('');
  }
}
