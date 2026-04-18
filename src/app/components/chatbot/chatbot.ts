import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ChatbotService } from '../../services/chatbot.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ChatMessage, Role } from '../../models';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css'],
})
export class Chatbot {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly chatbotService = inject(ChatbotService);
  private readonly notificationService = inject(NotificationService);

  protected readonly isClient = signal(this.authService.getStoredRole() === Role.CLIENT);
  protected readonly isVisible = signal(this.isClient() && this.router.url.startsWith('/dashboard'));
  protected readonly open = signal(false);
  protected readonly loading = signal(false);
  protected readonly messages = signal<ChatMessage[]>([]);

  protected readonly messageControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(250)],
  });

  private nextId = 1;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const shouldShow = this.isClient() && event.urlAfterRedirects.startsWith('/dashboard');
        this.isVisible.set(shouldShow);

        if (!shouldShow && this.open()) {
          this.open.set(false);
          this.resetChat();
        }
      });
  }

  protected get charsLeft(): number {
    return 250 - this.messageControl.value.length;
  }

  protected toggleChat(): void {
    if (!this.open()) {
      this.open.set(true);
      return;
    }

    if (this.messages().length === 0 && !this.loading()) {
      this.open.set(false);
      return;
    }

    const confirmed = window.confirm('Si cierras el chat se borrará toda la conversación. ¿Deseas continuar?');
    if (confirmed) {
      this.resetChat();
      this.open.set(false);
    }
  }

  protected sendMessage(): void {
    if (this.loading()) return;

    const rawMessage = this.messageControl.value;
    const message = rawMessage.trim();

    if (!message || message.length > 250) {
      this.messageControl.markAsTouched();
      return;
    }

    this.appendMessage('user', message);
    this.messageControl.setValue('');
    this.loading.set(true);

    this.chatbotService.sendMessage({ message }).subscribe({
      next: (response) => {
        const reply = response.reply?.trim() || 'No recibí respuesta en este momento.';
        this.appendMessage('bot', reply);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notificationService.error(this.notificationService.handleHttpError(err));
      },
    });
  }

  private appendMessage(role: 'user' | 'bot', text: string): void {
    const newMessage: ChatMessage = {
      id: this.nextId++,
      role,
      text,
      timestamp: new Date().toISOString(),
    };
    this.messages.update((prev) => [...prev, newMessage]);
  }

  private resetChat(): void {
    this.messages.set([]);
    this.loading.set(false);
    this.messageControl.setValue('');
  }
}
