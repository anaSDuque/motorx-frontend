import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProcedureService } from '../../services/procedure.service';
import { NotificationService } from '../../services/notification.service';
import {
  CreateProcedureDTO,
  ProcedureResponseDTO,
  UpdateProcedureDTO,
  UpdateServiceProceduresDTO,
  Role,
} from '../../models';

@Component({
  selector: 'app-procedures',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './procedures.html',
  styleUrl: './procedures.css',
})
export class Procedures implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly procedureService = inject(ProcedureService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  protected readonly procedures = signal<ProcedureResponseDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formLoading = signal(false);
  protected readonly formError = signal('');

  protected readonly serviceProceduresLoading = signal(false);
  protected readonly serviceProceduresError = signal('');
  protected readonly serviceProcedureIds = signal<number[]>([]);

  protected readonly procedureForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    active: [true],
  });

  protected readonly serviceForm = this.fb.group({
    serviceId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadProcedures();
  }

  protected get isAdmin(): boolean {
    return this.authService.getStoredRole() === Role.ADMIN;
  }

  protected loadProcedures(): void {
    this.loading.set(true);
    this.error.set('');

    const request$ = this.isAdmin
      ? this.procedureService.getProcedures()
      : this.procedureService.getActiveProcedures();

    request$.subscribe({
      next: (data) => {
        this.procedures.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.procedureForm.reset({ name: '', description: '', active: true });
    this.showForm.set(true);
  }

  protected openEditForm(procedure: ProcedureResponseDTO): void {
    this.editingId.set(procedure.id);
    this.formError.set('');
    this.procedureForm.reset({
      name: procedure.name,
      description: procedure.description ?? '',
      active: procedure.active,
    });
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  protected submitForm(): void {
    this.procedureForm.markAllAsTouched();

    if (this.procedureForm.invalid) {
      this.formError.set('Completa correctamente los campos obligatorios.');
      return;
    }

    const raw = this.procedureForm.getRawValue();
    const name = raw.name.trim();
    const description = raw.description?.trim() ?? '';

    if (!name) {
      this.formError.set('El nombre del procedimiento es obligatorio.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');

    if (this.editingId()) {
      const dto: UpdateProcedureDTO = {
        name,
        description: description || null,
        active: raw.active,
      };

      this.procedureService.updateProcedure(this.editingId()!, dto).subscribe({
        next: () => {
          this.formLoading.set(false);
          this.showForm.set(false);
          this.success.set('Procedimiento actualizado correctamente.');
          this.loadProcedures();
        },
        error: (err) => {
          this.formLoading.set(false);
          this.formError.set(this.notificationService.handleHttpError(err));
        },
      });
      return;
    }

    const dto: CreateProcedureDTO = {
      name,
      description: description || null,
      active: raw.active,
    };

    this.procedureService.createProcedure(dto).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.showForm.set(false);
        this.success.set('Procedimiento creado correctamente.');
        this.loadProcedures();
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected toggleActive(procedure: ProcedureResponseDTO): void {
    const dto: UpdateProcedureDTO = {
      name: procedure.name,
      description: procedure.description,
      active: !procedure.active,
    };

    this.procedureService.updateProcedure(procedure.id, dto).subscribe({
      next: () => this.loadProcedures(),
      error: (err) => this.notificationService.error(this.notificationService.handleHttpError(err)),
    });
  }

  protected loadServiceProcedures(): void {
    this.serviceForm.markAllAsTouched();
    if (this.serviceForm.invalid) {
      this.serviceProceduresError.set('Ingresa un ID de servicio valido.');
      return;
    }

    const serviceId = Number(this.serviceForm.controls.serviceId.value);

    this.serviceProceduresLoading.set(true);
    this.serviceProceduresError.set('');

    this.procedureService.getProceduresByService(serviceId).subscribe({
      next: (data) => {
        this.serviceProceduresLoading.set(false);
        this.serviceProcedureIds.set(data.map((item) => item.id));
      },
      error: (err) => {
        this.serviceProceduresLoading.set(false);
        this.serviceProceduresError.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected toggleServiceProcedure(procedureId: number): void {
    const current = this.serviceProcedureIds();
    if (current.includes(procedureId)) {
      this.serviceProcedureIds.set(current.filter((id) => id !== procedureId));
    } else {
      this.serviceProcedureIds.set([...current, procedureId]);
    }
  }

  protected saveServiceProcedures(): void {
    this.serviceForm.markAllAsTouched();
    if (this.serviceForm.invalid) {
      this.serviceProceduresError.set('Ingresa un ID de servicio valido.');
      return;
    }

    const serviceId = Number(this.serviceForm.controls.serviceId.value);
    const dto: UpdateServiceProceduresDTO = {
      procedureIds: this.serviceProcedureIds(),
    };

    this.serviceProceduresLoading.set(true);
    this.serviceProceduresError.set('');

    this.procedureService.updateServiceProcedures(serviceId, dto).subscribe({
      next: (data) => {
        this.serviceProceduresLoading.set(false);
        this.serviceProcedureIds.set(data.map((item) => item.id));
        this.notificationService.success('Procedimientos base actualizados.');
      },
      error: (err) => {
        this.serviceProceduresLoading.set(false);
        this.serviceProceduresError.set(this.notificationService.handleHttpError(err));
      },
    });
  }
}
