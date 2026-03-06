import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import esJson from '../i18n/es.json';
import enJson from '../i18n/en.json';

export type Language = 'es' | 'en';

const TRANSLATIONS: Record<Language, Record<string, unknown>> = {
    es: esJson as Record<string, unknown>,
    en: enJson as Record<string, unknown>,
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    private readonly _language = signal<Language>(this.getStoredLanguage());
    readonly language = this._language.asReadonly();

    constructor() {
        effect(() => {
            const lang = this._language();
            if (this.isBrowser) {
                document.documentElement.setAttribute('lang', lang);
                localStorage.setItem('motorx_language', lang);
            }
        });
    }

    setLanguage(lang: Language): void {
        this._language.set(lang);
    }

    t(key: string): string {
        const lang = this._language();
        const translations = TRANSLATIONS[lang];
        const keys = key.split('.');
        let result: unknown = translations;
        for (const k of keys) {
            if (result && typeof result === 'object') {
                result = (result as Record<string, unknown>)[k];
            } else {
                return key;
            }
        }
        return typeof result === 'string' ? result : key;
    }

    private getStoredLanguage(): Language {
        if (!this.isBrowser) return 'es';
        const stored = localStorage.getItem('motorx_language');
        if (stored === 'es' || stored === 'en') return stored;
        return 'es';
    }
}
