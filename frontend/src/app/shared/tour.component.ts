import { Component, computed, inject, signal } from '@angular/core';
import { DemoService } from '../core/demo.service';
import { LanguageService } from '../core/language.service';
import { IconComponent } from './icon.component';
import { BrandMarkComponent } from './brand-mark.component';

/** First-run guided tour (RF-09). Centered coach-mark modal, replayable from the shell. */
@Component({
  selector: 'dm-tour',
  imports: [IconComponent, BrandMarkComponent],
  template: `
    @if (demo.tourOpen()) {
      <div class="backdrop" (click)="onBackdrop($event)">
        <div class="tour card" role="dialog" aria-modal="true">
          <div class="thead">
            <dm-brand [tile]="26" />
            <button class="btn btn-subtle skip" (click)="skip()">{{ t().demo.skip }}</button>
          </div>

          <div class="tbody">
            <span class="step-mark ai-grad"><dm-icon [name]="icons[index()]" [size]="24" /></span>
            <h3>{{ step().title }}</h3>
            <p>{{ step().body }}</p>
          </div>

          <div class="tfoot">
            <div class="dots">
              @for (s of steps(); track $index) {
                <span class="dot" [class.on]="$index === index()"></span>
              }
            </div>
            <div class="nav">
              @if (index() > 0) {
                <button class="btn btn-ghost sm" (click)="back()">{{ t().demo.back }}</button>
              }
              @if (index() < steps().length - 1) {
                <button class="btn btn-primary sm" (click)="next()">{{ t().demo.next }}</button>
              } @else {
                <button class="btn btn-primary sm" (click)="finish()">{{ t().demo.gotIt }}</button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 70;
      background: rgba(26, 29, 38, 0.5);
      display: grid;
      place-items: center;
      padding: 1rem;
      animation: fade 160ms ease;
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    .tour {
      width: 100%;
      max-width: 25rem;
      padding: 1.25rem 1.5rem 1.5rem;
      box-shadow: var(--shadow-pop);
      animation: pop 180ms ease;
    }
    @keyframes pop {
      from {
        transform: translateY(8px) scale(0.98);
        opacity: 0;
      }
    }
    .thead {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .skip {
      font-size: 0.78rem;
      padding: 0.3rem 0.5rem;
    }
    .tbody {
      text-align: center;
      padding: 1.5rem 0.5rem 1.25rem;
    }
    .step-mark {
      width: 3.25rem;
      height: 3.25rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      color: #fff;
      margin: 0 auto 1rem;
    }
    .tbody h3 {
      font-size: 1.15rem;
    }
    .tbody p {
      margin-top: 0.55rem;
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--ink-500);
    }
    .tfoot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .dots {
      display: flex;
      gap: 0.4rem;
    }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--ink-200);
      transition: background 150ms ease;
    }
    .dot.on {
      background: var(--aiblue-500);
    }
    .nav {
      display: flex;
      gap: 0.5rem;
    }
    .btn.sm {
      padding: 0.5rem 0.9rem;
      font-size: 0.82rem;
    }
  `,
})
export class TourComponent {
  protected readonly demo = inject(DemoService);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;

  protected readonly icons = ['sparkles', 'file-text', 'shield-check'];
  protected readonly index = signal(0);
  protected readonly steps = computed(() => this.t().demo.steps);
  protected readonly step = computed(() => this.steps()[this.index()]);

  protected next(): void {
    this.index.update((i) => Math.min(i + 1, this.steps().length - 1));
  }
  protected back(): void {
    this.index.update((i) => Math.max(i - 1, 0));
  }
  protected finish(): void {
    this.index.set(0);
    this.demo.finish();
  }
  protected skip(): void {
    this.finish();
  }
  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.finish();
  }
}
