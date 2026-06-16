import { Injectable, computed, signal } from '@angular/core';
import { DocumentStatus, FileKind, Role } from './models';
import {
  COPY,
  FILEKIND_EN,
  FILEKIND_ES,
  Lang,
  ROLE_EN,
  ROLE_ES,
  STATUS_EN,
  STATUS_ES,
} from './i18n';

const LANG_KEY = 'documind.lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<Lang>(readStoredLang());

  /** App-wide copy for the active language. */
  readonly t = computed(() => COPY[this.lang()]);
  readonly isEs = computed(() => this.lang() === 'es');
  readonly dateLocale = computed(() => (this.lang() === 'es' ? 'es' : 'en-US'));

  set(lang: Lang): void {
    this.lang.set(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang;
  }

  /** Picks the EN or ES variant of a bilingual API field, with graceful fallback. */
  pick(en: string | null | undefined, es: string | null | undefined): string {
    return (this.lang() === 'es' ? es : en) ?? en ?? es ?? '';
  }

  status(value: DocumentStatus): string {
    return (this.lang() === 'es' ? STATUS_ES : STATUS_EN)[value] ?? value;
  }
  role(value: Role): string {
    return (this.lang() === 'es' ? ROLE_ES : ROLE_EN)[value] ?? value;
  }
  fileKind(value: FileKind): string {
    return (this.lang() === 'es' ? FILEKIND_ES : FILEKIND_EN)[value] ?? value;
  }
}

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    /* ignore */
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}
