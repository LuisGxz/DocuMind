import { Injectable, signal } from '@angular/core';

const TOUR_KEY = 'documind.tourSeen';

/** Tracks the first-run guided tour (RF-09). Persisted so it shows once, replayable on demand. */
@Injectable({ providedIn: 'root' })
export class DemoService {
  /** Whether the coach-mark tour is currently open. */
  readonly tourOpen = signal(false);

  /** Opens the tour automatically on first visit. */
  maybeAutoStart(): void {
    if (!this.seen()) this.tourOpen.set(true);
  }

  start(): void {
    this.tourOpen.set(true);
  }

  finish(): void {
    this.tourOpen.set(false);
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  private seen(): boolean {
    try {
      return localStorage.getItem(TOUR_KEY) === '1';
    } catch {
      return false;
    }
  }
}
