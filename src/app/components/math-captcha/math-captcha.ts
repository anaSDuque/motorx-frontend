import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-math-captcha',
    standalone: true,
    imports: [FormsModule, TranslatePipe],
    template: `
    <div class="captcha-container">
      <div class="captcha-header">
        <i class="bi bi-shield-check"></i>
        <span>{{ ('captcha.title' | translate) || 'Verificación de Seguridad' }}</span>
        <button type="button" class="btn-refresh" (click)="generateChallenge()" title="Generar nuevo">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
      
      <div class="captcha-body">
        <div class="challenge-display">
          <span class="number">{{ num1() }}</span>
          <span class="operator">{{ operator() }}</span>
          <span class="number">{{ num2() }}</span>
          <span class="equals">=</span>
          <span class="question">?</span>
        </div>
        
        <div class="input-wrapper">
          <input type="number" class="captcha-input" 
            [(ngModel)]="userAnswer" (ngModelChange)="checkAnswer()" 
            [class.valid]="isSolved() === true"
            [class.invalid]="isSolved() === false"
            placeholder="?" 
            min="0"
            aria-label="Respuesta del captcha" />
        </div>
      </div>
      
      @if (isSolved() === false && userAnswer() !== null && userAnswer()?.toString() !== '') {
        <div class="captcha-error">
          <i class="bi bi-exclamation-circle"></i>
          Respuesta incorrecta. Intenta de nuevo.
        </div>
      }
    </div>
  `,
    styles: [`
    .captcha-container {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #dee2e6;
      border-radius: 12px;
      padding: 16px;
      transition: all 0.3s ease;
    }
    
    .captcha-container:focus-within {
      border-color: var(--mx-primary, #1a73e8);
      box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.15);
    }
    
    .captcha-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #dee2e6;
    }
    
    .captcha-header i:first-child {
      color: var(--mx-primary, #1a73e8);
      font-size: 1.1rem;
    }
    
    .captcha-header span {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6c757d;
      flex: 1;
    }
    
    .btn-refresh {
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }
    
    .btn-refresh:hover {
      background: #dee2e6;
      color: var(--mx-primary, #1a73e8);
    }
    
    .captcha-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    
    .challenge-display {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 1.5rem;
      font-weight: 700;
      padding: 8px 16px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #ced4da;
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 5px,
        rgba(0, 0, 0, 0.02) 5px,
        rgba(0, 0, 0, 0.02) 10px
      );
      user-select: none;
    }
    
    .number {
      color: #212529;
      min-width: 24px;
      text-align: center;
    }
    
    .operator {
      color: var(--mx-primary, #1a73e8);
      min-width: 20px;
      text-align: center;
    }
    
    .equals {
      color: #6c757d;
    }
    
    .question {
      color: var(--mx-primary, #1a73e8);
      font-style: italic;
    }
    
    .input-wrapper {
      position: relative;
      flex: 1;
      max-width: 120px;
    }
    
    .captcha-input {
      width: 100%;
      padding: 10px 36px 10px 14px;
      font-size: 1.25rem;
      font-weight: 600;
      text-align: center;
      border: 2px solid #ced4da;
      border-radius: 8px;
      background: #ffffff;
      transition: all 0.2s ease;
      -moz-appearance: textfield;
    }
    
    .captcha-input::-webkit-outer-spin-button,
    .captcha-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    .captcha-input:focus {
      outline: none;
      border-color: var(--mx-primary, #1a73e8);
      box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
    }
    
    .captcha-input.valid {
      border-color: #198754;
      background-color: #d1e7dd;
    }
    
    .captcha-input.invalid {
      border-color: #dc3545;
      background-color: #f8d7da;
    }
    
    .status-icon {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.1rem;
    }
    
    .valid-icon {
      color: #198754;
    }
    
    .invalid-icon {
      color: #dc3545;
    }
    
    .captcha-error {
      margin-top: 10px;
      padding: 8px 12px;
      background: #f8d7da;
      border: 1px solid #f5c2c7;
      border-radius: 6px;
      color: #842029;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 6px;
      animation: shake 0.3s ease-in-out;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    @media (max-width: 480px) {
      .captcha-body {
        flex-direction: column;
      }
      
      .input-wrapper {
        max-width: 100%;
        width: 100%;
      }
    }
  `]
})
export class MathCaptcha {
    @Output() solved = new EventEmitter<boolean>();

    num1 = signal(0);
    num2 = signal(0);
    operator = signal('+');
    private answer = 0;

    userAnswer = signal<number | null>(null);
    isSolved = signal<boolean | null>(null);

    constructor() {
        this.generateChallenge();
    }

    generateChallenge(): void {
        const operations = ['+', '-', '×'];
        const opIndex = Math.floor(Math.random() * operations.length);
        const operation = operations[opIndex];
        
        this.operator.set(operation);

        if (operation === '+') {
            this.num1.set(Math.floor(Math.random() * 30) + 1);
            this.num2.set(Math.floor(Math.random() * 30) + 1);
            this.answer = this.num1() + this.num2();
        } else if (operation === '-') {
            this.num1.set(Math.floor(Math.random() * 25) + 10);
            this.num2.set(Math.floor(Math.random() * this.num1()) + 1);
            this.answer = this.num1() - this.num2();
        } else { // multiplication
            this.num1.set(Math.floor(Math.random() * 10) + 1);
            this.num2.set(Math.floor(Math.random() * 10) + 1);
            this.answer = this.num1() * this.num2();
        }

        this.userAnswer.set(null);
        this.isSolved.set(null);
        this.solved.emit(false);
    }

    checkAnswer(): void {
        if (this.userAnswer() === null || this.userAnswer()?.toString() === '') {
            this.isSolved.set(null);
            this.solved.emit(false);
            return;
        }

        const correct = this.userAnswer() === this.answer;
        this.isSolved.set(correct);
        this.solved.emit(correct);
    }
}
