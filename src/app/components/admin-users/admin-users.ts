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
    const map: Record<string, string> = { CLIENT: 'bg-info', EMPLOYEE: 'bg-warning', ADMIN: 'bg-danger' };
    return map[role] ?? 'bg-secondary';
  }
}
