import { Component, inject, signal, OnInit } from '@angular/core';
import { AdminUserService } from '../../services/admin-user.service';
import { AdminUserResponseDTO } from '../../models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css'],
})
export class AdminUsers implements OnInit {
  private readonly userService = inject(AdminUserService);

  protected readonly users = signal<AdminUserResponseDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected blockUser(id: number): void {
    this.userService.blockUser(id).subscribe({
      next: () => {
        this.success.set('Usuario bloqueado');
        this.loadUsers();
      },
      error: (err) => this.error.set(err.error?.message ?? 'Error al bloquear'),
    });
  }

  protected unblockUser(id: number): void {
    this.userService.unblockUser(id).subscribe({
      next: () => {
        this.success.set('Usuario desbloqueado');
        this.loadUsers();
      },
      error: (err) => this.error.set(err.error?.message ?? 'Error al desbloquear'),
    });
  }

  protected deleteUser(id: number): void {
    if (!confirm('¿Eliminar este usuario? Se realizará un soft delete.')) return;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.success.set('Usuario eliminado exitosamente');
        this.loadUsers();
      },
      error: (err) => this.error.set(err.error?.message ?? 'Error al eliminar'),
    });
  }

  protected getRoleBadge(role: string): string {
    const normalized = this.normalizeRole(role);
    const map: Record<string, string> = {
      CLIENT: 'bg-info',
      EMPLOYEE: 'bg-warning text-dark',
      ADMIN: 'bg-danger',
      TECHNICIAN: 'bg-primary',
      RECEPTIONIST: 'bg-success',
      WARE_HOUSE_WORKER: 'bg-secondary',
    };
    return map[normalized] ?? 'bg-secondary';
  }

  protected getRoleLabel(role: string): string {
    const normalized = this.normalizeRole(role);
    const labels: Record<string, string> = {
      CLIENT: 'Cliente',
      EMPLOYEE: 'Empleado',
      ADMIN: 'Administrador',
      TECHNICIAN: 'Técnico',
      RECEPTIONIST: 'Recepcionista',
      WARE_HOUSE_WORKER: 'T. de Bodega',
    };
    return labels[normalized] ?? role;
  }

  private normalizeRole(role: string): string {
    const clean = String(role ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');

    if (clean === 'WAREHOUSE_WORKER') {
      return 'WARE_HOUSE_WORKER';
    }

    return clean;
  }
}
