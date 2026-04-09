import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AdminEmployeeService } from '../../services/admin-employee.service';
import {
  EmployeeResponseDTO,
  CreateEmployeeRequestDTO,
  UpdateEmployeeRequestDTO,
  EmployeePosition,
  EmployeeState,
} from '../../models';

@Component({
  selector: 'app-admin-employees',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-employees.html',
  styleUrls: ['./admin-employees.css'],
})
export class AdminEmployees implements OnInit {
  private static readonly DNI_REGEX = /^\d{6,12}$/;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private static readonly PHONE_REGEX = /^\d{7,10}$/;
  private static readonly STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;

  private readonly employeeService = inject(AdminEmployeeService);

  protected readonly employees = signal<EmployeeResponseDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

  // Form
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formLoading = signal(false);
  protected readonly formError = signal('');

  // Create fields
  protected readonly position = signal<EmployeePosition>(EmployeePosition.MECANICO);
  protected readonly state = signal<EmployeeState>(EmployeeState.AVAILABLE);
  protected readonly userName = signal('');
  protected readonly userDni = signal('');
  protected readonly userEmail = signal('');
  protected readonly userPassword = signal('');
  protected readonly userPhone = signal('');

  protected readonly positions = Object.values(EmployeePosition);
  protected readonly states = Object.values(EmployeeState);

  protected readonly positionControl = new FormControl<EmployeePosition>(EmployeePosition.MECANICO, { nonNullable: true });
  protected readonly stateControl = new FormControl<EmployeeState>(EmployeeState.AVAILABLE, { nonNullable: true });
  protected readonly userNameControl = new FormControl('', { nonNullable: true });
  protected readonly userDniControl = new FormControl('', { nonNullable: true });
  protected readonly userEmailControl = new FormControl('', { nonNullable: true });
  protected readonly userPasswordControl = new FormControl('', { nonNullable: true });
  protected readonly userPhoneControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.positionControl.valueChanges.subscribe((value) => this.position.set(value));
    this.stateControl.valueChanges.subscribe((value) => this.state.set(value));
    this.userNameControl.valueChanges.subscribe((value) => this.userName.set(value));
    this.userPasswordControl.valueChanges.subscribe((value) => this.userPassword.set(value));

    this.userDniControl.valueChanges.subscribe((value) => {
      const sanitized = value.replace(/\D/g, '').slice(0, 12);
      if (sanitized !== value) {
        this.userDniControl.setValue(sanitized, { emitEvent: false });
      }
      this.userDni.set(sanitized);
    });

    this.userPhoneControl.valueChanges.subscribe((value) => {
      const sanitized = value.replace(/\D/g, '').slice(0, 10);
      if (sanitized !== value) {
        this.userPhoneControl.setValue(sanitized, { emitEvent: false });
      }
      this.userPhone.set(sanitized);
    });

    this.userEmailControl.valueChanges.subscribe((value) => {
      const normalized = value.trim().toLowerCase();
      if (normalized !== value) {
        this.userEmailControl.setValue(normalized, { emitEvent: false });
      }
      this.userEmail.set(normalized);
    });
  }

  protected sanitizeDni(value: string): void {
    this.userDniControl.setValue(value.replace(/\D/g, '').slice(0, 12));
  }

  protected sanitizePhone(value: string): void {
    this.userPhoneControl.setValue(value.replace(/\D/g, '').slice(0, 10));
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  private loadEmployees(): void {
    this.loading.set(true);
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
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

  protected openEditForm(e: EmployeeResponseDTO): void {
    this.editingId.set(e.employeeId);
    this.position.set(e.position);
    this.state.set(e.state);
    this.positionControl.setValue(e.position, { emitEvent: false });
    this.stateControl.setValue(e.state, { emitEvent: false });
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
      const dto: UpdateEmployeeRequestDTO = {
        position: this.position(),
        state: this.state(),
      };
      this.employeeService.updateEmployee(this.editingId()!, dto).subscribe({
        next: () => {
          this.formLoading.set(false);
          this.showForm.set(false);
          this.success.set('Empleado actualizado');
          this.loadEmployees();
        },
        error: (err) => {
          this.formLoading.set(false);
          this.formError.set(err.error?.message ?? 'Error al actualizar');
        },
      });
    } else {
      const normalizedName = this.userName().trim().replace(/\s+/g, ' ');
      const normalizedDni = this.userDni().replace(/\D/g, '');
      const normalizedEmail = this.userEmail().trim().toLowerCase();
      const normalizedPhone = this.userPhone().replace(/\D/g, '');
      const normalizedPassword = this.userPassword();

      this.userName.set(normalizedName);
      this.userDni.set(normalizedDni);
      this.userEmail.set(normalizedEmail);
      this.userPhone.set(normalizedPhone);

      if (!normalizedName || !normalizedDni || !normalizedEmail || !normalizedPassword.trim() || !normalizedPhone) {
        this.formLoading.set(false);
        this.formError.set('Completa todos los campos obligatorios');
        return;
      }
      if (!AdminEmployees.DNI_REGEX.test(normalizedDni)) {
        this.formLoading.set(false);
        this.formError.set('El DNI debe contener solo números (6 a 12 dígitos)');
        return;
      }
      if (!AdminEmployees.EMAIL_REGEX.test(normalizedEmail)) {
        this.formLoading.set(false);
        this.formError.set('Ingresa un correo electrónico válido');
        return;
      }
      if (!AdminEmployees.PHONE_REGEX.test(normalizedPhone)) {
        this.formLoading.set(false);
        this.formError.set('Ingresa un teléfono válido (7 a 10 dígitos)');
        return;
      }
      if (!AdminEmployees.STRONG_PASSWORD_REGEX.test(normalizedPassword)) {
        this.formLoading.set(false);
        this.formError.set('La contraseña temporal debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo');
        return;
      }

      const dto: CreateEmployeeRequestDTO = {
        position: this.position(),
        user: {
          name: normalizedName,
          dni: normalizedDni,
          email: normalizedEmail,
          password: normalizedPassword,
          phone: normalizedPhone,
        },
      };
      this.employeeService.createEmployee(dto).subscribe({
        next: () => {
          this.formLoading.set(false);
          this.showForm.set(false);
          this.success.set('Empleado creado exitosamente');
          this.loadEmployees();
        },
        error: (err) => {
          this.formLoading.set(false);
          this.formError.set(err.error?.message ?? 'Error al crear');
        },
      });
    }
  }

  protected deleteEmployee(id: number): void {
    if (!confirm('¿Eliminar este empleado? Esta acción es irreversible.')) return;
    this.employeeService.deleteEmployee(id).subscribe({
      next: () => {
        this.success.set('Empleado eliminado');
        this.loadEmployees();
      },
      error: (err) => this.error.set(err.error?.message ?? 'Error al eliminar'),
    });
  }

  protected getStateLabel(state: string): string {
    return state === 'AVAILABLE' ? 'Disponible' : 'No disponible';
  }

  protected getStateBadge(state: string): string {
    return state === 'AVAILABLE' ? 'bg-success' : 'bg-secondary';
  }

  private resetForm(): void {
    this.position.set(EmployeePosition.MECANICO);
    this.state.set(EmployeeState.AVAILABLE);
    this.userName.set('');
    this.userDni.set('');
    this.userEmail.set('');
    this.userPassword.set('');
    this.userPhone.set('');
    this.positionControl.setValue(EmployeePosition.MECANICO, { emitEvent: false });
    this.stateControl.setValue(EmployeeState.AVAILABLE, { emitEvent: false });
    this.userNameControl.setValue('', { emitEvent: false });
    this.userDniControl.setValue('', { emitEvent: false });
    this.userEmailControl.setValue('', { emitEvent: false });
    this.userPasswordControl.setValue('', { emitEvent: false });
    this.userPhoneControl.setValue('', { emitEvent: false });
    this.formError.set('');
  }
}
