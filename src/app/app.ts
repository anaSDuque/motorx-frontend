import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './components/toast-container/toast-container';
import { AccessibilityWidget } from './components/accessibility-widget/accessibility-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, AccessibilityWidget],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { }
