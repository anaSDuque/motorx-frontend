import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { OrderService } from '../../services/order.service';
import { TechnicianDailyOrderDTO } from '../../models';

@Component({
  selector: 'app-technician-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './technician-home.html',
  styleUrl: './technician-home.css',
})
export class TechnicianHome implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);

  protected readonly userName = signal('');
  protected readonly todayOrders = signal<TechnicianDailyOrderDTO[]>([]);
  protected readonly loadingOrders = signal(false);
  protected readonly errorOrders = signal('');

  ngOnInit(): void {
    this.userName.set(this.authService.getStoredUserName() ?? 'Tecnico');
    this.loadTodayOrders();
  }

  private loadTodayOrders(): void {
    this.loadingOrders.set(true);
    this.errorOrders.set('');

    this.orderService.getMyTodayOrders().subscribe({
      next: (data) => {
        this.todayOrders.set(data);
        this.loadingOrders.set(false);
      },
      error: (err) => {
        this.loadingOrders.set(false);
        this.errorOrders.set(this.notificationService.handleHttpError(err));
      },
    });
  }
}
