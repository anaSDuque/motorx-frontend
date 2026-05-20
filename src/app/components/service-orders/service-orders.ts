import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ProcedureService } from '../../services/procedure.service';
import { SpareService } from '../../services/spare.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import {
  AddProcedureToOrderDTO,
  AddSpareToOrderDTO,
  OrderResponseDTO,
  TechnicianAppointmentSummaryDTO,
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
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly procedureService = inject(ProcedureService);
  private readonly spareService = inject(SpareService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  protected readonly order = signal<OrderResponseDTO | null>(null);
  protected readonly appointment = signal<TechnicianAppointmentSummaryDTO | null>(null);
  protected readonly procedures = signal<ProcedureResponseDTO[]>([]);
  protected readonly spares = signal<SpareResponseDTO[]>([]);
  protected readonly loading = signal(false);
  protected readonly appointmentLoading = signal(false);
  protected readonly appointmentError = signal('');
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly procedureCostEdits = signal<Record<number, number>>({});
  protected readonly pendingProcedures = signal<Array<{ id: number; cost: number }>>([]);
  protected readonly procedureSelectControl = this.fb.control<number | null>(null);

  protected readonly orderForm = this.fb.group({
    appointmentId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  protected readonly addSpareForm = this.fb.group({
    spareId: [null as number | null, [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  protected readonly isTechnician = computed(() => this.authService.getStoredRole() === Role.TECHNICIAN);
  protected readonly canEditOrder = computed(() => this.isTechnician());

  ngOnInit(): void {
    this.loadCatalogs();
    this.prefillAppointmentFromQuery();
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
        this.loadAppointmentDetails(data.appointmentId);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.notificationService.handleHttpError(err));
      },
    });
  }

  protected queueProcedure(): void {
    const selectedId = Number(this.procedureSelectControl.value);
    if (!selectedId) return;

    if (this.isProcedureInOrder(selectedId)) {
      this.error.set('El procedimiento ya esta en la orden.');
      this.procedureSelectControl.setValue(null);
      return;
    }

    this.pendingProcedures.update((current) =>
      current.some((item) => item.id === selectedId) ? current : [...current, { id: selectedId, cost: 0 }]
    );
    this.procedureSelectControl.setValue(null);
  }

  protected updatePendingCost(procedureId: number, value: string): void {
    const numeric = Number(value);
    this.pendingProcedures.update((current) =>
      current.map((item) =>
        item.id === procedureId
          ? { ...item, cost: Number.isFinite(numeric) && numeric >= 0 ? numeric : 0 }
          : item
      )
    );
  }

  protected removePendingProcedure(procedureId: number): void {
    this.pendingProcedures.update((current) => current.filter((item) => item.id !== procedureId));
  }

  protected addPendingProcedure(procedureId: number): void {
    if (!this.canEditOrder() || !this.order()) return;

    const pending = this.pendingProcedures().find((item) => item.id === procedureId);
    if (!pending) return;

    if (pending.cost < 0) {
      this.error.set('Ingresa un costo valido.');
      return;
    }

    const dto: AddProcedureToOrderDTO = {
      procedureId: pending.id,
      cost: Number(pending.cost),
    };

    this.loading.set(true);
    this.error.set('');

    this.orderService.addProcedure(this.order()!.id, dto).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.setOrder(data);
        this.pendingProcedures.update((current) => current.filter((item) => item.id !== procedureId));
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

  protected getProcedureName(procedureId: number): string {
    const procedure = this.procedures().find((item) => item.id === procedureId);
    return procedure?.name ?? `#${procedureId}`;
  }

  private setOrder(order: OrderResponseDTO): void {
    this.order.set(order);
    const costMap: Record<number, number> = {};
    order.procedures.forEach((procedure) => {
      costMap[procedure.procedureId] = procedure.cost;
    });
    this.procedureCostEdits.set(costMap);
  }

  private isProcedureInOrder(procedureId: number): boolean {
    return (this.order()?.procedures ?? []).some((item) => item.procedureId === procedureId);
  }

  private prefillAppointmentFromQuery(): void {
    const raw = this.route.snapshot.queryParamMap.get('appointmentId');
    const appointmentId = raw ? Number(raw) : null;
    if (!appointmentId || Number.isNaN(appointmentId) || appointmentId < 1) {
      return;
    }

    this.orderForm.patchValue({ appointmentId });
    this.loadOrder();
  }

  private loadAppointmentDetails(appointmentId: number): void {
    this.appointmentLoading.set(true);
    this.appointmentError.set('');

    this.orderService.getAppointmentSummary(appointmentId).subscribe({
      next: (data) => {
        this.appointment.set(data);
        this.appointmentLoading.set(false);
      },
      error: (err) => {
        this.appointmentLoading.set(false);
        this.appointmentError.set(this.notificationService.handleHttpError(err));
      },
    });
  }
}
