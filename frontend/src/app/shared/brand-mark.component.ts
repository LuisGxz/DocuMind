import { Component, Input } from '@angular/core';
import { IconComponent } from './icon.component';

/** The DocuMind sparkles mark on the gradient tile, optionally with the wordmark. */
@Component({
  selector: 'dm-brand',
  imports: [IconComponent],
  template: `
    <span class="brand">
      <span class="tile ai-grad" [style.width.px]="tile" [style.height.px]="tile">
        <dm-icon name="sparkles" [size]="tile * 0.55" />
      </span>
      @if (showName) {
        <span class="name">DocuMind</span>
      }
    </span>
  `,
  styles: `
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
    }
    .tile {
      display: grid;
      place-items: center;
      border-radius: 0.6rem;
      color: #fff;
      box-shadow: var(--shadow-sm);
    }
    .name {
      font-weight: 700;
      letter-spacing: -0.02em;
      font-size: 1.05rem;
    }
  `,
})
export class BrandMarkComponent {
  @Input() tile = 28;
  @Input() showName = true;
}
