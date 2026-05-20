import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { OurServicesService } from '../../services/our-services.service';
import { ProcedureService } from '../../services/procedure.service';
import {
  CreateServiceDTO,
  UpdateServiceDTO,
  ServiceResponseDTO,
  ProcedureResponseDTO,
  UpdateServiceProceduresDTO,
} from '../../models';
import { map, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-services.html',
  styleUrl: './admin-services.css',
})
export class AdminServices implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly servicesService = inject(OurServicesService);
  private readonly procedureService = inject(ProcedureService);
  private readonly notificationService = inject(NotificationService);

  protected readonly services = signal<ServiceResponseDTO[]>([]);
  protected readonly procedures = signal<ProcedureResponseDTO[]>([]);
  protected readonly selectedProcedureIds = signal<number[]>([]);
  protected readonly procedureSelectControl = this.fb.control<number | null>(null);

  protected readonly loading = signal(true);
  protected readonly proceduresLoading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formLoading = signal(false);
  protected readonly formError = signal('');
  protected readonly showProcedureModal = signal(false);
  protected readonly procedureFormLoading = signal(false);
  protected readonly procedureFormError = signal('');

  protected readonly serviceForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    estimatedDurationMinutes: [1, [Validators.required, Validators.min(1)]],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    active: [true],
  });

  protected readonly procedureForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    active: [true],
  });

  ngOnInit(): void {
    this.loadServices();
    this.loadProcedures();
  }

  protected loadServices(): void {
    this.loading.set(true);
    this.error.set('');

    this.servicesService.getServices().subscribe({
      next: (data) => {
        this.services.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected loadProcedures(): void {
    this.proceduresLoading.set(true);
    this.procedureService.getProcedures().subscribe({
      next: (data) => {
        this.procedures.set(data);
        this.proceduresLoading.set(false);
      },
      error: (err) => {
        this.proceduresLoading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.serviceForm.reset({
      name: '',
      description: '',
      estimatedDurationMinutes: 1,
      basePrice: 0,
      active: true,
    });
    this.selectedProcedureIds.set([]);
    this.procedureSelectControl.setValue(null);
    this.showForm.set(true);
  }

  protected openEditForm(service: ServiceResponseDTO): void {
    this.editingId.set(service.id);
    this.formError.set('');
    this.serviceForm.reset({
      name: service.name,
      description: service.description ?? '',
      estimatedDurationMinutes: service.estimatedDurationMinutes,
      basePrice: service.basePrice,
      active: service.active,
    });
    this.selectedProcedureIds.set(service.baseProcedures.map((procedure) => procedure.id));
    this.procedureSelectControl.setValue(null);
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  protected openProcedureModal(): void {
    this.procedureForm.reset({ name: '', description: '', active: true });
    this.procedureFormError.set('');
    this.showProcedureModal.set(true);
  }

  protected closeProcedureModal(): void {
    this.showProcedureModal.set(false);
    this.procedureFormError.set('');
  }

  protected submitProcedureForm(): void {
    this.procedureForm.markAllAsTouched();
    if (this.procedureForm.invalid) {
      this.procedureFormError.set('Completa correctamente los campos requeridos.');
      return;
    }

    const raw = this.procedureForm.getRawValue();
    const name = raw.name.trim();
    const description = raw.description?.trim() ?? '';

    if (!name) {
      this.procedureFormError.set('El nombre del procedimiento es obligatorio.');
      return;
    }

    this.procedureFormLoading.set(true);
    this.procedureFormError.set('');

    this.procedureService
      .createProcedure({
        name,
        description: description || null,
        active: raw.active,
      })
      .subscribe({
        next: (created) => {
          this.procedureFormLoading.set(false);
          this.showProcedureModal.set(false);
          this.notificationService.success('Procedimiento creado correctamente.');
          this.loadProcedures();
          this.selectedProcedureIds.update((current) =>
            current.includes(created.id) ? current : [...current, created.id]
          );
        },
        error: (err) => {
          this.procedureFormLoading.set(false);
          this.procedureFormError.set(this.notificationService.handleHttpError(err));
        },
      });
  }

  protected submitForm(): void {
    this.serviceForm.markAllAsTouched();
    if (this.serviceForm.invalid) {
      this.formError.set('Completa correctamente los campos requeridos.');
      return;
    }

    const raw = this.serviceForm.getRawValue();
    const name = raw.name.trim();
    const description = raw.description?.trim() ?? '';

    if (!name) {
      this.formError.set('El nombre del servicio es obligatorio.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');

    if (this.editingId()) {
      const dto: UpdateServiceDTO = {
        name,
        description: description || null,
        estimatedDurationMinutes: Number(raw.estimatedDurationMinutes),
        basePrice: Number(raw.basePrice),
        active: raw.active,
      };
      const proceduresDto: UpdateServiceProceduresDTO = {
        procedureIds: this.selectedProcedureIds(),
      };

      this.servicesService
        .updateService(this.editingId()!, dto)
        .pipe(
          switchMap((updated) =>
            this.servicesService
              .updateServiceProcedures(updated.id, proceduresDto)
              .pipe(map(() => updated))
          )
        )
        .subscribe({
          next: () => {
            this.formLoading.set(false);
            this.showForm.set(false);
            this.success.set('Servicio actualizado correctamente.');
            this.loadServices();
          },
          error: (err) => {
            this.formLoading.set(false);
            this.formError.set(this.notificationService.handleHttpError(err));
          },
        });
      return;
    }

    const procedureIds = this.selectedProcedureIds();
    const dto: CreateServiceDTO = {
      name,
      description: description || null,
      estimatedDurationMinutes: Number(raw.estimatedDurationMinutes),
      basePrice: Number(raw.basePrice),
      active: raw.active,
      ...(procedureIds.length > 0 ? { procedureIds } : {}),
    };

    this.servicesService.createService(dto).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.showForm.set(false);
        this.success.set('Servicio creado correctamente.');
        this.loadServices();
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected deleteService(serviceId: number): void {
    if (!confirm('¿Eliminar este servicio?')) return;

    this.servicesService.deleteService(serviceId).subscribe({
      next: () => {
        this.success.set('Servicio eliminado correctamente.');
        this.loadServices();
      },
      error: (err) => {
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected addSelectedProcedure(): void {
    const selectedId = Number(this.procedureSelectControl.value);
    if (!selectedId) return;

    this.selectedProcedureIds.update((current) =>
      current.includes(selectedId) ? current : [...current, selectedId]
    );
    this.procedureSelectControl.setValue(null);
  }

  protected removeSelectedProcedure(procedureId: number): void {
    this.selectedProcedureIds.update((current) => current.filter((id) => id !== procedureId));
  }

  protected getProcedureName(procedureId: number): string {
    const procedure = this.procedures().find((item) => item.id === procedureId);
    return procedure?.name ?? `#${procedureId}`;
  }

  protected getProcedureSummary(service: ServiceResponseDTO): string {
    const names = service.baseProcedures.map((item) => item.name).filter(Boolean);
    if (names.length === 0) return 'Sin procedimientos base';
    return names.join(', ');
  }

  protected hasError(controlName: keyof typeof this.serviceForm.controls, errorName: string): boolean {
    const control = this.serviceForm.controls[controlName];
    return control.touched && control.hasError(errorName);
  }
}
