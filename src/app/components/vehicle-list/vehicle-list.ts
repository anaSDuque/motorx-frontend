import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserVehicleService } from '../../services/user-vehicle.service';
import { VehicleResponseDTO, CreateVehicleRequestDTO, UpdateVehicleRequestDTO } from '../../models';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './vehicle-list.html',
  styleUrls: ['./vehicle-list.css'],
})
export class VehicleList implements OnInit {
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
    this.formLoading.set(true);
    this.formError.set('');
    this.fieldErrors.set({});

    if (this.editingId()) {
      const dto: UpdateVehicleRequestDTO = {
        brand: this.brand(),
        model: this.model(),
        cylinderCapacity: this.cylinderCapacity(),
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
      const dto: CreateVehicleRequestDTO = {
        brand: this.brand(),
        model: this.model(),
        yearOfManufacture: this.yearOfManufacture(),
        licensePlate: this.licensePlate(),
        cylinderCapacity: this.cylinderCapacity(),
        chassisNumber: this.chassisNumber(),
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
    this.formError.set(err.error?.message ?? 'Error al guardar');
  }

  private resetForm(): void {
    this.brand.set('');
    this.model.set('');
    this.yearOfManufacture.set(2024);
    this.licensePlate.set('');
    this.cylinderCapacity.set(150);
    this.chassisNumber.set('');
    this.formError.set('');
    this.fieldErrors.set({});
  }
}
