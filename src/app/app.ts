import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './components/toast-container/toast-container';
import { AccessibilityWidget } from './components/accessibility-widget/accessibility-widget';
import { Chatbot } from './components/chatbot/chatbot';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, AccessibilityWidget, Chatbot],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App { }
