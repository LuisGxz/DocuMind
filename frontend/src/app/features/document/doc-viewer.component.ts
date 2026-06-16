import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { LanguageService } from '../../core/language.service';
import { Citation, DocumentPage, FileKind } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { highlightPage } from './highlight.util';

@Component({
  selector: 'dm-doc-viewer',
  imports: [IconComponent],
  template: `
    <div class="viewer">
      <div class="vhead">
        <dm-icon name="file-text" [size]="16" />
        <span class="fname" [title]="filename()">{{ filename() }}</span>
        <span class="pmeta num">{{ pages().length }} {{ lang.t().common.pages }}</span>
      </div>

      <div class="vbody" #scroll>
        @for (pg of highlighted(); track pg.page) {
          <article class="sheet" [attr.data-page]="pg.page">
            <p class="pno mono">{{ lang.t().doc.page }} {{ pg.page }}</p>
            <p class="ptext doc">
              @for (seg of pg.segments; track $index) {
                @if (seg.cited) {
                  <span
                    class="cite-hl"
                    [class.hot]="seg.hot"
                    [attr.data-chunk]="seg.chunkId"
                    >{{ seg.text }}</span
                  >
                } @else {
                  {{ seg.text }}
                }
              }
            </p>
          </article>
        }
      </div>
    </div>
  `,
  styles: `
    .viewer {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    .vhead {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.7rem 1rem;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--ink-100) 50%, transparent);
      color: var(--ink-500);
    }
    .fname {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ink-900);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .pmeta {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--ink-400);
      flex-shrink: 0;
    }
    .vbody {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 1.25rem;
      background: color-mix(in srgb, var(--ink-100) 35%, transparent);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .sheet {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      box-shadow: var(--shadow-sm);
      padding: 1.75rem 2rem;
      max-width: 40rem;
      margin-inline: auto;
      width: 100%;
    }
    .pno {
      font-size: 0.65rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink-400);
      margin-bottom: 0.85rem;
    }
    .ptext {
      font-size: 0.92rem;
      line-height: 1.75;
      color: var(--ink-700);
      white-space: pre-wrap;
    }
    .cite-hl {
      background: var(--cite);
      border-radius: 3px;
      padding: 0 2px;
      scroll-margin: 6rem;
      transition:
        outline-color 200ms ease,
        background 200ms ease;
      outline: 2px solid transparent;
    }
    .cite-hl.hot {
      outline-color: var(--cite-hot);
      background: #ffe89a;
    }
  `,
})
export class DocViewerComponent {
  protected readonly lang = inject(LanguageService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly filename = input.required<string>();
  readonly fileKind = input<FileKind>('pdf');
  readonly pages = input.required<DocumentPage[]>();
  readonly citations = input<Citation[]>([]);
  readonly activeChunkId = input<string | null>(null);

  protected readonly highlighted = computed(() => {
    const cites = this.citations();
    const active = this.activeChunkId();
    return this.pages().map((p) => ({
      page: p.page,
      segments: highlightPage(p.text, cites.filter((c) => c.page === p.page), active),
    }));
  });

  constructor() {
    // Scroll the active (hovered) citation into view; otherwise reveal the first cited page.
    effect(() => {
      const active = this.activeChunkId();
      const cites = this.citations();
      queueMicrotask(() => {
        const el = active
          ? this.host.nativeElement.querySelector(`[data-chunk="${active}"]`)
          : cites.length
            ? this.host.nativeElement.querySelector(`[data-page="${cites[0].page}"]`)
            : null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }
}
