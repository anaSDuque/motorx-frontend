import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    /** Font scale as a percentage (80–160). Default is 100. */
    private readonly _fontScale = signal<number>(this.getStoredScale());
    readonly fontScale = this._fontScale.asReadonly();

    constructor() {
        effect(() => {
            const scale = this._fontScale();
            if (this.isBrowser) {
                const multiplier = (scale / 100).toFixed(2);
                document.documentElement.style.setProperty('--mx-font-multiplier', multiplier);
                localStorage.setItem('motorx_font_scale', String(scale));
            }
        });
    }

    setFontScale(scale: number): void {
        this._fontScale.set(Math.max(80, Math.min(160, scale)));
    }

    private getStoredScale(): number {
        if (!this.isBrowser) return 100;
        const stored = localStorage.getItem('motorx_font_scale');
        if (stored) {
            const val = parseInt(stored, 10);
            if (!isNaN(val) && val >= 80 && val <= 160) return val;
        }
        return 100;
    }
}
