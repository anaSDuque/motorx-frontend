import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { AccessibilityService } from '../../services/accessibility.service';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-accessibility-widget',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Floating toggle button -->
    <button class="a11y-toggle" (click)="open.set(!open())" title="Accesibilidad"
      [class.active]="open()">
      <i class="bi bi-universal-access fs-5"></i>
    </button>

    <!-- Panel -->
    @if (open()) {
    <div class="a11y-panel" (click)="$event.stopPropagation()">
      <h6 class="fw-bold mb-3 d-flex align-items-center gap-2">
        <i class="bi bi-universal-access"></i> Accesibilidad
      </h6>

      <!-- Font Size Slider -->
      <div class="a11y-section mb-3">
        <label class="a11y-label mb-2">
          <i class="bi bi-fonts me-2"></i>Tamaño de texto
        </label>
        <div class="slider-container">
          <span class="slider-label-sm">A</span>
          <input type="range" class="form-range a11y-slider" min="80" max="160" step="5"
            [ngModel]="accessibilityService.fontScale()"
            (ngModelChange)="accessibilityService.setFontScale($event)" />
          <span class="slider-label-lg">A</span>
        </div>
        <div class="text-center mt-1">
          <span class="badge bg-primary bg-opacity-25 text-primary-emphasis small fw-bold">{{ accessibilityService.fontScale() }}%</span>
        </div>
      </div>

      <!-- Theme -->
      <div class="a11y-section mb-3">
        <label class="a11y-label mb-2">
          <i class="bi bi-circle-half me-2"></i>Tema
        </label>
        <div class="d-flex gap-2">
          <button class="a11y-btn flex-fill" [class.selected]="!themeService.isDark()"
            (click)="setTheme('light')">
            <i class="bi bi-sun-fill me-1"></i>Claro
          </button>
          <button class="a11y-btn flex-fill" [class.selected]="themeService.isDark()"
            (click)="setTheme('dark')">
            <i class="bi bi-moon-fill me-1"></i>Oscuro
          </button>
        </div>
      </div>

      <!-- Language -->
      <div class="a11y-section">
        <label class="a11y-label mb-2">
          <i class="bi bi-translate me-2"></i>Idioma
        </label>
        <div class="d-flex gap-2">
          <button class="a11y-btn flex-fill" [class.selected]="languageService.language() === 'es'"
            (click)="setLanguage('es')">
            🇪🇸 Español
          </button>
          <button class="a11y-btn flex-fill" [class.selected]="languageService.language() === 'en'"
            (click)="setLanguage('en')">
            🇺🇸 English
          </button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    :host { position: fixed; bottom: 24px; right: 24px; z-index: 10000; }

    .a11y-toggle {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, var(--mx-primary), var(--mx-primary-hover));
      color: #fff; border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(26,115,232,0.4);
      transition: all 0.3s ease;
      display: flex; align-items: center; justify-content: center;
    }
    .a11y-toggle:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(26,115,232,0.5); }
    .a11y-toggle.active { transform: rotate(15deg) scale(1.1); }

    .a11y-panel {
      position: absolute; bottom: 64px; right: 0;
      width: 290px; padding: 20px;
      background: var(--mx-bg-card);
      backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid var(--mx-border-light);
      border-radius: 20px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      animation: panelSlideUp 0.25s cubic-bezier(0.16,1,0.3,1);
    }

    .a11y-label {
      font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; opacity: 0.7; display: block;
    }

    .a11y-btn {
      padding: 8px 10px; border-radius: 10px; border: 2px solid var(--mx-border);
      background: transparent; color: var(--mx-text); font-weight: 600;
      font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease;
      display: flex; align-items: center; justify-content: center;
    }
    .a11y-btn:hover { border-color: var(--mx-primary); color: var(--mx-primary); }
    .a11y-btn.selected {
      background: var(--mx-primary); color: #fff;
      border-color: var(--mx-primary);
      box-shadow: 0 2px 8px rgba(26,115,232,0.3);
    }

    /* Slider styles */
    .slider-container {
      display: flex; align-items: center; gap: 10px;
    }
    .slider-label-sm { font-size: 0.75rem; font-weight: 700; opacity: 0.5; }
    .slider-label-lg { font-size: 1.25rem; font-weight: 700; opacity: 0.5; }

    .a11y-slider {
      flex: 1; height: 6px; cursor: pointer;
    }
    .a11y-slider::-webkit-slider-thumb {
      background: var(--mx-primary);
      box-shadow: 0 0 8px rgba(26,115,232,0.4);
    }
    .a11y-slider::-moz-range-thumb {
      background: var(--mx-primary);
      box-shadow: 0 0 8px rgba(26,115,232,0.4);
    }

    @keyframes panelSlideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AccessibilityWidget {
  protected readonly themeService = inject(ThemeService);
  protected readonly accessibilityService = inject(AccessibilityService);
  protected readonly languageService = inject(LanguageService);
  protected readonly open = signal(false);

  protected setTheme(theme: 'light' | 'dark'): void {
    if (this.themeService.isDark() && theme === 'light') this.themeService.toggleTheme();
    if (!this.themeService.isDark() && theme === 'dark') this.themeService.toggleTheme();
  }

  protected setLanguage(lang: Language): void {
    this.languageService.setLanguage(lang);
  }
}
