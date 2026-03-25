import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-math-captcha',
    standalone: true,
    imports: [ReactiveFormsModule, TranslatePipe],
    templateUrl: './math-captcha.html',
    styleUrls: ['./math-captcha.css']
})
export class MathCaptcha {
    @Output() solved = new EventEmitter<boolean>();

    num1 = signal(0);
    num2 = signal(0);
    operator = signal('+');
    private answer = 0;

    userAnswer = signal<number | null>(null);
    protected readonly userAnswerControl = new FormControl<number | string | null>(null);
    isSolved = signal<boolean | null>(null);

    constructor() {
      this.userAnswerControl.valueChanges.subscribe((value) => {
        const parsed = value === null || value === undefined || value === '' ? null : Number(value);
        this.userAnswer.set(Number.isNaN(parsed as number) ? null : parsed);
        this.checkAnswer();
      });
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

        this.userAnswerControl.setValue(null, { emitEvent: false });
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
