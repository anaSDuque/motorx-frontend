import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule],
  templateUrl: './spare-list.html',
  styleUrl: './spare-list.css',
})
export class SpareList implements OnInit {
  private readonly spareService = inject(SpareService);
  private readonly authService = inject(AuthService);

  protected readonly spares = signal<SpareResponseDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formLoading = signal(false);
  protected readonly formError = signal('');

  protected readonly savCode = signal('');
  protected readonly spareCode = signal('');
  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly quantity = signal<number>(0);
  protected readonly purchasePriceWithVat = signal<number>(0);
  protected readonly isOil = signal(false);
  protected readonly warehouseLocation = signal('00-00-00-00');

  ngOnInit(): void {
    this.loadSpares();
  }

  protected get isAdmin(): boolean {
    return this.authService.getStoredRole() === Role.ADMIN;
  }

  protected loadSpares(): void {
    this.loading.set(true);
    this.spareService.getSpares().subscribe({
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
    this.showForm.set(true);
  }

  protected openEditForm(spare: SpareResponseDTO): void {
    this.editingId.set(spare.id);
    this.savCode.set(spare.savCode);
    this.spareCode.set(spare.spareCode);
    this.name.set(spare.name);
    this.description.set(spare.description ?? '');
    this.quantity.set(spare.quantity);
    this.purchasePriceWithVat.set(spare.purchasePriceWithVat);
    this.isOil.set(spare.isOil);
    this.warehouseLocation.set(spare.warehouseLocation);
    this.formError.set('');
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.resetForm();
  }

  protected onSubmit(): void {
    this.formLoading.set(true);
    this.formError.set('');

    if (this.editingId()) {
      const dto: UpdateSpareDTO = {
        savCode: this.savCode(),
        spareCode: this.spareCode(),
        name: this.name(),
        description: this.description() || undefined,
        quantity: this.quantity(),
        purchasePriceWithVat: this.purchasePriceWithVat(),
        isOil: this.isOil(),
        warehouseLocation: this.warehouseLocation(),
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
      savCode: this.savCode(),
      spareCode: this.spareCode(),
      name: this.name(),
      description: this.description() || undefined,
      quantity: this.quantity(),
      purchasePriceWithVat: this.purchasePriceWithVat(),
      isOil: this.isOil(),
      warehouseLocation: this.warehouseLocation(),
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

  private resetForm(): void {
    this.savCode.set('');
    this.spareCode.set('');
    this.name.set('');
    this.description.set('');
    this.quantity.set(0);
    this.purchasePriceWithVat.set(0);
    this.isOil.set(false);
    this.warehouseLocation.set('00-00-00-00');
    this.formError.set('');
  }
}
