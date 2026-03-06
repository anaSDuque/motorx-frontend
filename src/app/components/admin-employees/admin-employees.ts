import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule],
  templateUrl: './admin-employees.html',
  styleUrls: ['./admin-employees.css'],
})
export class AdminEmployees implements OnInit {
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
      const dto: CreateEmployeeRequestDTO = {
        position: this.position(),
        user: {
          name: this.userName(),
          dni: this.userDni(),
          email: this.userEmail(),
          password: this.userPassword(),
          phone: this.userPhone(),
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
    this.formError.set('');
  }
}
