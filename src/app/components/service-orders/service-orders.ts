import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { ProcedureService } from '../../services/procedure.service';
import { SpareService } from '../../services/spare.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import {
  AddProcedureToOrderDTO,
  AddSpareToOrderDTO,
  OrderResponseDTO,
  ProcedureResponseDTO,
  SpareResponseDTO,
  Role,
} from '../../models';

@Component({
  selector: 'app-service-orders',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './service-orders.html',
  styleUrl: './service-orders.css',
})
export class ServiceOrders implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly procedureService = inject(ProcedureService);
  private readonly spareService = inject(SpareService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  protected readonly order = signal<OrderResponseDTO | null>(null);
  protected readonly procedures = signal<ProcedureResponseDTO[]>([]);
  protected readonly spares = signal<SpareResponseDTO[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly procedureCostEdits = signal<Record<number, number>>({});

  protected readonly orderForm = this.fb.group({
    appointmentId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  protected readonly addProcedureForm = this.fb.group({
    procedureId: [null as number | null, [Validators.required]],
    cost: [0, [Validators.required, Validators.min(0)]],
  });

  protected readonly addSpareForm = this.fb.group({
    spareId: [null as number | null, [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  protected readonly isTechnician = computed(() => this.authService.getStoredRole() === Role.TECHNICIAN);
  protected readonly canEditOrder = computed(() => this.isTechnician());

  ngOnInit(): void {
    this.loadCatalogs();
  }

  private loadCatalogs(): void {
    this.procedureService.getActiveProcedures().subscribe({
      next: (data) => this.procedures.set(data),
      error: () => {},
    });
    this.spareService.getSpares().subscribe({
      next: (data) => this.spares.set(data),
      error: () => {},
    });
  }

  protected loadOrder(): void {
    this.orderForm.markAllAsTouched();
    if (this.orderForm.invalid) {
      this.error.set('Ingresa un ID de cita valido.');
      return;
    }

    const appointmentId = Number(this.orderForm.controls.appointmentId.value);

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const request$ = this.isTechnician()
      ? this.orderService.createOrderByAppointment(appointmentId)
      : this.orderService.getOrderByAppointment(appointmentId);

    request$.subscribe({
      next: (data) => {
        this.loading.set(false);
        this.setOrder(data);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected addProcedure(): void {
    if (!this.canEditOrder() || !this.order()) return;

    this.addProcedureForm.markAllAsTouched();
    if (this.addProcedureForm.invalid) {
      this.error.set('Completa los datos del procedimiento.');
      return;
    }

    const raw = this.addProcedureForm.getRawValue();
    const dto: AddProcedureToOrderDTO = {
      procedureId: Number(raw.procedureId),
      cost: Number(raw.cost),
    };

    this.loading.set(true);
    this.error.set('');

    this.orderService.addProcedure(this.order()!.id, dto).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.addProcedureForm.reset({ procedureId: null, cost: 0 });
        this.setOrder(data);
        this.success.set('Procedimiento agregado correctamente.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected updateProcedureCost(procedureId: number): void {
    if (!this.canEditOrder() || !this.order()) return;

    const cost = this.procedureCostEdits()[procedureId];
    if (cost === undefined || cost === null || Number(cost) < 0) {
      this.error.set('Ingresa un costo valido.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.orderService.updateProcedureCost(this.order()!.id, procedureId, { cost: Number(cost) }).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.setOrder(data);
        this.success.set('Costo actualizado correctamente.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected addSpare(): void {
    if (!this.canEditOrder() || !this.order()) return;

    this.addSpareForm.markAllAsTouched();
    if (this.addSpareForm.invalid) {
      this.error.set('Completa los datos del repuesto.');
      return;
    }

    const raw = this.addSpareForm.getRawValue();
    const dto: AddSpareToOrderDTO = {
      spareId: Number(raw.spareId),
      quantity: Number(raw.quantity),
    };

    this.loading.set(true);
    this.error.set('');

    this.orderService.addSpare(this.order()!.id, dto).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.addSpareForm.reset({ spareId: null, quantity: 1 });
        this.setOrder(data);
        this.success.set('Repuesto agregado correctamente.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected completeOrder(): void {
    if (!this.canEditOrder() || !this.order()) return;

    this.loading.set(true);
    this.error.set('');

    this.orderService.completeOrder(this.order()!.id).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.setOrder(data);
        this.success.set('Orden completada correctamente.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected updateEditCost(procedureId: number, value: string): void {
    const numeric = Number(value);
    this.procedureCostEdits.update((current) => ({
      ...current,
      [procedureId]: Number.isFinite(numeric) ? numeric : 0,
    }));
  }

  private setOrder(order: OrderResponseDTO): void {
    this.order.set(order);
    const costMap: Record<number, number> = {};
    order.procedures.forEach((procedure) => {
      costMap[procedure.procedureId] = procedure.cost;
    });
    this.procedureCostEdits.set(costMap);
  }
}
