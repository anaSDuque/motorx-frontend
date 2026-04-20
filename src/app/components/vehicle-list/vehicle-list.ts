import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserVehicleService } from '../../services/user-vehicle.service';
import { VehicleResponseDTO, CreateVehicleRequestDTO, UpdateVehicleRequestDTO } from '../../models';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './vehicle-list.html',
  styleUrls: ['./vehicle-list.css'],
})
export class VehicleList implements OnInit {
    private static readonly PLATE_REGEX = /^[A-Z]{3}[0-9]{2}[A-Z]$/;

  private readonly vehicleService = inject(UserVehicleService);

  protected readonly vehicles = signal<VehicleResponseDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

  // Form state
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formLoading = signal(false);
  protected readonly formError = signal('');
  protected readonly fieldErrors = signal<Record<string, string>>({});

  // Form fields
  protected readonly brand = signal('');
  protected readonly model = signal('');
  protected readonly yearOfManufacture = signal<number>(2024);
  protected readonly licensePlate = signal('');
  protected readonly cylinderCapacity = signal<number>(150);
  protected readonly chassisNumber = signal('');

  protected readonly brandControl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] });
  protected readonly modelControl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] });
  protected readonly yearControl = new FormControl(2024, { nonNullable: true, validators: [Validators.required, Validators.min(1950), Validators.max(new Date().getFullYear())] });
  protected readonly plateControl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(VehicleList.PLATE_REGEX)] });
  protected readonly ccControl = new FormControl(150, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(9999)] });
  protected readonly chassisControl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] });
  protected readonly vehicleForm = new FormGroup({
    brand: this.brandControl,
    model: this.modelControl,
    yearOfManufacture: this.yearControl,
    licensePlate: this.plateControl,
    cylinderCapacity: this.ccControl,
    chassisNumber: this.chassisControl,
  });

  constructor() {
    this.brandControl.valueChanges.subscribe((value) => this.brand.set(value));
    this.modelControl.valueChanges.subscribe((value) => this.model.set(value));
    this.yearControl.valueChanges.subscribe((value) => {
      const normalized = this.normalizeInteger(value, 1950, new Date().getFullYear());
      if (normalized !== value) {
        this.yearControl.setValue(normalized, { emitEvent: false });
      }
      this.yearOfManufacture.set(normalized);
    });
    this.ccControl.valueChanges.subscribe((value) => {
      const normalized = this.normalizeInteger(value, 1, 9999);
      if (normalized !== value) {
        this.ccControl.setValue(normalized, { emitEvent: false });
      }
      this.cylinderCapacity.set(normalized);
    });
    this.chassisControl.valueChanges.subscribe((value) => this.chassisNumber.set(value));
    this.plateControl.valueChanges.subscribe((value) => {
      const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      if (normalized !== value) {
        this.plateControl.setValue(normalized, { emitEvent: false });
      }
      this.licensePlate.set(normalized);
    });
  }

  ngOnInit(): void {
    this.loadVehicles();
  }

  private loadVehicles(): void {
    this.loading.set(true);
    this.vehicleService.getMyVehicles().subscribe({
      next: (data) => {
        this.vehicles.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected openCreateForm(): void {
    this.resetForm();
    this.editingId.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(v: VehicleResponseDTO): void {
    this.brand.set(v.brand);
    this.model.set(v.model);
    this.cylinderCapacity.set(v.cylinderCapacity);
    this.yearOfManufacture.set(v.yearOfManufacture);
    this.licensePlate.set(v.licensePlate);
    this.chassisNumber.set(v.chassisNumber);
    this.brandControl.setValue(v.brand, { emitEvent: false });
    this.modelControl.setValue(v.model, { emitEvent: false });
    this.ccControl.setValue(v.cylinderCapacity, { emitEvent: false });
    this.yearControl.setValue(v.yearOfManufacture, { emitEvent: false });
    this.plateControl.setValue(v.licensePlate, { emitEvent: false });
    this.chassisControl.setValue(v.chassisNumber, { emitEvent: false });
    this.editingId.set(v.id);
    this.formError.set('');
    this.fieldErrors.set({});
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.resetForm();
  }

  protected onSubmit(): void {
    this.brandControl.markAsTouched();
    this.modelControl.markAsTouched();
    this.ccControl.markAsTouched();
    if (!this.editingId()) {
      this.yearControl.markAsTouched();
      this.plateControl.markAsTouched();
      this.chassisControl.markAsTouched();
    }

    if (this.hasInvalidVehicleForm()) {
      this.formError.set('Completa correctamente los campos del formulario.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');
    this.fieldErrors.set({});

    const normalizedBrand = this.brand().trim();
    const normalizedModel = this.model().trim();
    const normalizedCc = this.normalizeInteger(this.cylinderCapacity(), 1, 9999);

    if (this.editingId()) {
      const dto: UpdateVehicleRequestDTO = {
        brand: normalizedBrand,
        model: normalizedModel,
        cylinderCapacity: normalizedCc,
      };
      this.vehicleService.updateVehicle(this.editingId()!, dto).subscribe({
        next: () => {
          this.formLoading.set(false);
          this.showForm.set(false);
          this.success.set('Vehículo actualizado exitosamente');
          this.loadVehicles();
        },
        error: (err) => this.handleFormError(err),
      });
    } else {
      const normalizedYear = this.normalizeInteger(this.yearOfManufacture(), 1950, new Date().getFullYear());
      const normalizedPlate = this.licensePlate().trim().toUpperCase();
      const normalizedChassis = this.chassisNumber().trim();

      const dto: CreateVehicleRequestDTO = {
        brand: normalizedBrand,
        model: normalizedModel,
        yearOfManufacture: normalizedYear,
        licensePlate: normalizedPlate,
        cylinderCapacity: normalizedCc,
        chassisNumber: normalizedChassis,
      };
      this.vehicleService.createVehicle(dto).subscribe({
        next: () => {
          this.formLoading.set(false);
          this.showForm.set(false);
          this.success.set('Vehículo registrado exitosamente');
          this.loadVehicles();
        },
        error: (err) => this.handleFormError(err),
      });
    }
  }

  protected deleteVehicle(id: number): void {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;
    this.vehicleService.deleteVehicle(id).subscribe({
      next: () => {
        this.success.set('Vehículo eliminado');
        this.loadVehicles();
      },
      error: (err) => this.error.set(err.error?.message ?? 'Error al eliminar'),
    });
  }

  private handleFormError(err: any): void {
    this.formLoading.set(false);
    if (err.error?.details) this.fieldErrors.set(err.error.details);
    this.formError.set(this.extractApiErrorMessage(err, 'Error al guardar'));
  }

  protected hasInvalidVehicleForm(): boolean {
    if (this.editingId()) {
      return this.brandControl.invalid || this.modelControl.invalid || this.ccControl.invalid;
    }
    return (
      this.brandControl.invalid ||
      this.modelControl.invalid ||
      this.yearControl.invalid ||
      this.plateControl.invalid ||
      this.ccControl.invalid ||
      this.chassisControl.invalid
    );
  }

  protected sanitizeYearInput(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (!digits) {
      this.yearControl.setValue(1950);
      return;
    }
    this.yearControl.setValue(this.normalizeInteger(Number(digits), 1950, new Date().getFullYear()));
  }

  protected sanitizeCcInput(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (!digits) {
      this.ccControl.setValue(1);
      return;
    }
    this.ccControl.setValue(this.normalizeInteger(Number(digits), 1, 9999));
  }

  private normalizeInteger(value: unknown, min: number, max: number): number {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric) || Number.isNaN(numeric)) return min;
    return Math.max(min, Math.min(max, Math.trunc(numeric)));
  }

  private extractApiErrorMessage(err: any, fallback: string): string {
    const backend = err?.error;
    const message = typeof backend?.message === 'string' ? backend.message.trim() : '';

    if (backend?.details && typeof backend.details === 'object') {
      const details = Object.values(backend.details as Record<string, unknown>)
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0)
        .join(', ');
      if (message && details) return `${message}: ${details}`;
      if (details) return details;
    }

    if (message) return message;
    return fallback;
  }

  private resetForm(): void {
    this.brand.set('');
    this.model.set('');
    this.yearOfManufacture.set(2024);
    this.licensePlate.set('');
    this.cylinderCapacity.set(150);
    this.chassisNumber.set('');
    this.brandControl.setValue('', { emitEvent: false });
    this.modelControl.setValue('', { emitEvent: false });
    this.yearControl.setValue(2024, { emitEvent: false });
    this.plateControl.setValue('', { emitEvent: false });
    this.ccControl.setValue(150, { emitEvent: false });
    this.chassisControl.setValue('', { emitEvent: false });
    this.formError.set('');
    this.fieldErrors.set({});
  }
}
