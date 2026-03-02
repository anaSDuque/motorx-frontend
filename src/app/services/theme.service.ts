import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _theme = signal<Theme>(this.getStoredTheme());
  readonly theme = this._theme.asReadonly();
  readonly isDark = () => this._theme() === 'dark';

  constructor() {
    effect(() => {
      const theme = this._theme();
      if (this.isBrowser) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('motorx_theme', theme);
      }
    });
  }

  toggleTheme(): void {
    this._theme.update((current) => (current === 'light' ? 'dark' : 'light'));
  }

  private getStoredTheme(): Theme {
    if (!this.isBrowser) return 'light';
    const stored = localStorage.getItem('motorx_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
