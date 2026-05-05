import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-technician-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './technician-home.html',
  styleUrl: './technician-home.css',
})
export class TechnicianHome implements OnInit {
  private readonly authService = inject(AuthService);

  protected readonly userName = signal('');

  ngOnInit(): void {
    this.userName.set(this.authService.getStoredUserName() ?? 'Tecnico');
  }
}
