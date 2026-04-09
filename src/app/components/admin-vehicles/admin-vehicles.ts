import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AdminVehicleService } from '../../services/admin-vehicle.service';
import { VehicleResponseDTO } from '../../models';

@Component({
  selector: 'app-admin-vehicles',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-vehicles.html',
  styleUrls: ['./admin-vehicles.css'],
})
export class AdminVehicles implements OnInit {
  private readonly vehicleService = inject(AdminVehicleService);

  protected readonly vehicles = signal<VehicleResponseDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly showTransferModal = signal(false);
  protected readonly selectedVehicleId = signal<number | null>(null);
  protected readonly newOwnerId = signal<number | null>(null);
  protected readonly newOwnerIdControl = new FormControl<number | null>(null);
  protected readonly transferring = signal(false);

  constructor() {
    this.newOwnerIdControl.valueChanges.subscribe((value) => this.newOwnerId.set(value ?? null));
  }

  ngOnInit(): void {
    this.loadVehicles();
  }

  private loadVehicles(): void {
    this.loading.set(true);
    this.vehicleService.getAllVehicles().subscribe({
      next: (data) => {
        this.vehicles.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected openTransfer(vehicleId: number): void {
    this.selectedVehicleId.set(vehicleId);
    this.newOwnerId.set(null);
    this.newOwnerIdControl.setValue(null, { emitEvent: false });
    this.showTransferModal.set(true);
  }

  protected cancelTransfer(): void {
    this.showTransferModal.set(false);
    this.selectedVehicleId.set(null);
  }

  protected confirmTransfer(): void {
    const vehicleId = this.selectedVehicleId();
    const ownerId = this.newOwnerId();
    if (!vehicleId || !ownerId) return;

    this.transferring.set(true);
    this.vehicleService
      .transferOwnership(vehicleId, { newOwnerId: ownerId })
      .subscribe({
        next: () => {
          this.success.set('Transferencia realizada exitosamente');
          this.showTransferModal.set(false);
          this.transferring.set(false);
          this.loadVehicles();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? 'Error en transferencia');
          this.transferring.set(false);
        },
      });
  }
}
