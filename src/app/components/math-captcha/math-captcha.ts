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
    private lastChallengeKey = '';

    constructor() {
      this.userAnswerControl.valueChanges.subscribe((value) => {
        const parsed = value === null || value === undefined || value === '' ? null : Number(value);
        this.userAnswer.set(Number.isNaN(parsed as number) ? null : parsed);
        this.checkAnswer();
      });
        this.generateChallenge();
    }

    generateChallenge(): void {
        const operations = ['+', '-', '×'] as const;

        let operation: (typeof operations)[number] = '+';
        let first = 0;
        let second = 0;
        let expected = 0;
        let challengeKey = '';

        // Avoid returning exactly the same challenge on manual refresh.
        for (let attempts = 0; attempts < 10; attempts++) {
            const opIndex = Math.floor(Math.random() * operations.length);
            operation = operations[opIndex];

            if (operation === '+') {
                first = Math.floor(Math.random() * 30) + 1;
                second = Math.floor(Math.random() * 30) + 1;
                expected = first + second;
            } else if (operation === '-') {
                first = Math.floor(Math.random() * 25) + 10;
                second = Math.floor(Math.random() * first) + 1;
                expected = first - second;
            } else {
                first = Math.floor(Math.random() * 10) + 1;
                second = Math.floor(Math.random() * 10) + 1;
                expected = first * second;
            }

            challengeKey = `${operation}:${first}:${second}:${expected}`;
            if (challengeKey !== this.lastChallengeKey) {
                break;
            }
        }

        this.lastChallengeKey = challengeKey;
        this.operator.set(operation);
        this.num1.set(first);
        this.num2.set(second);
        this.answer = expected;

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
