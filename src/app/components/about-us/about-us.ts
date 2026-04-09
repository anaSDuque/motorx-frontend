import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './about-us.html',
  styleUrls: ['./about-us.css']
})
export class AboutUs {
  @Input() floating = false;
  @Output() closeRequested = new EventEmitter<void>();

  protected closeFloating(): void {
    this.closeRequested.emit();
  }
}
