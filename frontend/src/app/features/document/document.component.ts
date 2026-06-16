import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { parseApiError } from '../../core/api-error';
import { STATUS_BADGE } from '../../core/i18n';
import { WorkspaceStore } from '../../core/workspace.store';
import { Citation, DocumentDetailDto, DocumentPage } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { DocViewerComponent } from './doc-viewer.component';
import { ChatPanelComponent } from './chat-panel.component';

type Tab = 'doc' | 'chat';

@Component({
  selector: 'dm-document',
  imports: [RouterLink, IconComponent, DocViewerComponent, ChatPanelComponent],
  template: `
    <div class="docpage">
      @if (loading()) {
        <div class="container loadwrap">
          <div class="skeleton" style="height:2.5rem;width:60%"></div>
          <div class="split-skel">
            <div class="skeleton" style="height:100%"></div>
            <div class="skeleton" style="height:100%"></div>
          </div>
        </div>
      } @else if (error()) {
        <div class="container state">
          <dm-icon name="alert-triangle" [size]="28" />
          <p>{{ error() }}</p>
          <a routerLink="/library" class="btn btn-ghost">{{ t().doc.back }}</a>
        </div>
      } @else if (doc(); as d) {
        <!-- top bar -->
        <div class="topbar">
          <div class="container tbinner">
            <a routerLink="/library" class="back">
              <dm-icon name="arrow-left" [size]="18" /> <span class="back-t">{{ t().doc.back }}</span>
            </a>
            <div class="title">
              <span class="fname" [title]="d.filename">{{ d.filename }}</span>
              <span class="badge" [class]="statusBadge(d)">{{ lang.status(d.status) }}</span>
            </div>
            <div class="owner-actions">
              @if (isOwner()) {
                <button
                  class="btn btn-ghost sm"
                  (click)="reprocess()"
                  [disabled]="busy()"
                  [title]="t().doc.reprocess"
                >
                  <dm-icon name="rotate-cw" [size]="16" [class.spin]="busy()" />
                  <span class="lbl">{{ busy() ? t().doc.reprocessing : t().doc.reprocess }}</span>
                </button>
                <button class="btn btn-ghost sm danger" (click)="remove()" [title]="t().doc.delete">
                  <dm-icon name="trash" [size]="16" />
                </button>
              }
            </div>
          </div>
        </div>

        <!-- summary -->
        @if (summary(); as s) {
          <div class="container summary-wrap">
            <details class="summary card" open>
              <summary>
                <dm-icon name="book-open" [size]="15" />
                <span>{{ t().doc.summary }}</span>
              </summary>
              <p>{{ s }}</p>
            </details>
          </div>
        }

        <!-- mobile tabs -->
        <div class="tabs">
          <button [class.on]="tab() === 'doc'" (click)="tab.set('doc')">
            <dm-icon name="file-text" [size]="16" /> {{ lang.isEs() ? 'Documento' : 'Document' }}
          </button>
          <button [class.on]="tab() === 'chat'" (click)="tab.set('chat')">
            <dm-icon name="sparkles" [size]="16" /> {{ t().chat.title }}
          </button>
        </div>

        @if (d.status !== 'Indexed') {
          <div class="container state">
            <dm-icon name="clock" [size]="26" />
            <p>{{ t().doc.notIndexed }}</p>
          </div>
        } @else {
          <div class="container splitwrap">
            <div class="split card">
              <div class="pane viewer-pane" [class.hide-mobile]="tab() !== 'doc'">
                <dm-doc-viewer
                  [filename]="d.filename"
                  [fileKind]="d.fileKind"
                  [pages]="pages()"
                  [citations]="citations()"
                  [activeChunkId]="activeChunk()"
                />
              </div>
              <div class="pane chat-pane" [class.hide-mobile]="tab() !== 'chat'">
                <dm-chat-panel
                  [documentId]="d.id"
                  [pageCount]="d.pageCount"
                  (citations)="citations.set($event)"
                  (activeChunk)="activeChunk.set($event)"
                />
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .docpage {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .topbar {
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    .tbinner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-block: 0.7rem;
    }
    .back {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ink-500);
      flex-shrink: 0;
    }
    .back:hover {
      color: var(--ink-900);
    }
    .title {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      min-width: 0;
    }
    .fname {
      font-size: 0.9rem;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .owner-actions {
      margin-left: auto;
      display: flex;
      gap: 0.4rem;
      flex-shrink: 0;
    }
    .btn.sm {
      padding: 0.45rem 0.7rem;
      font-size: 0.8rem;
    }
    .btn.danger:hover {
      border-color: var(--danger);
      color: var(--danger);
    }

    .summary-wrap {
      padding-top: 1rem;
    }
    .summary {
      padding: 0.85rem 1rem;
    }
    .summary summary {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ink-500);
      cursor: pointer;
      list-style: none;
    }
    .summary summary::-webkit-details-marker {
      display: none;
    }
    .summary p {
      margin-top: 0.6rem;
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--ink-700);
    }

    .tabs {
      display: none;
    }

    .splitwrap {
      padding-block: 1rem 1.5rem;
    }
    .split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      height: calc(100vh - var(--header-h) - 9rem);
      min-height: 30rem;
      overflow: hidden;
      padding: 0;
    }
    .pane {
      min-width: 0;
      min-height: 0;
    }
    .viewer-pane {
      border-right: 1px solid var(--border);
    }

    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
      padding: 4rem 1rem;
      color: var(--ink-500);
    }
    .loadwrap {
      padding-block: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .split-skel {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      height: 28rem;
    }

    @media (max-width: 820px) {
      .tabs {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem 1rem 0;
        max-width: var(--maxw);
        margin-inline: auto;
      }
      .tabs button {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.55rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--ink-500);
        cursor: pointer;
      }
      .tabs button.on {
        border-color: var(--aiblue-500);
        color: var(--aiblue-600);
        background: var(--aiblue-50);
      }
      .split {
        grid-template-columns: 1fr;
        height: calc(100vh - var(--header-h) - 7rem);
      }
      .viewer-pane {
        border-right: none;
      }
      .pane.hide-mobile {
        display: none;
      }
      .back-t,
      .owner-actions .lbl {
        display: none;
      }
    }
  `,
})
export class DocumentComponent {
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  private readonly api = inject(ApiService);
  private readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);

  /** Route param, bound via withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly doc = signal<DocumentDetailDto | null>(null);
  protected readonly pages = signal<DocumentPage[]>([]);
  protected readonly busy = signal(false);
  protected readonly tab = signal<Tab>('doc');

  protected readonly citations = signal<Citation[]>([]);
  protected readonly activeChunk = signal<string | null>(null);

  protected readonly isOwner = computed(() => this.store.role() === 'Owner');
  protected readonly summary = computed(() => {
    const d = this.doc();
    if (!d) return null;
    return this.lang.pick(d.summary, d.summaryEs) || null;
  });

  private loadedId = '';

  constructor() {
    void this.store.ensureLoaded();
    queueMicrotask(() => this.load());
  }

  private async load(): Promise<void> {
    const id = this.id();
    if (this.loadedId === id) return;
    this.loadedId = id;
    this.loading.set(true);
    this.error.set(null);
    try {
      const detail = await firstValueFrom(this.api.getDocument(id));
      this.doc.set(detail);
      if (detail.status === 'Indexed') {
        this.pages.set(await firstValueFrom(this.api.getDocumentContent(id)));
      }
    } catch (err) {
      this.error.set(parseApiError(err, this.t().doc.loadError)[0]);
    } finally {
      this.loading.set(false);
    }
  }

  protected statusBadge(d: DocumentDetailDto): string {
    return STATUS_BADGE[d.status];
  }

  protected async reprocess(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await firstValueFrom(this.api.reprocessDocument(this.id()));
      // Re-poll until indexed, then reload content.
      await this.pollUntilIndexed();
    } catch {
      /* surfaced via badge */
    } finally {
      this.busy.set(false);
    }
  }

  private async pollUntilIndexed(): Promise<void> {
    for (let i = 0; i < 40; i++) {
      const status = await firstValueFrom(this.api.getDocumentStatus(this.id()));
      const d = this.doc();
      if (d) this.doc.set({ ...d, status: status.status, statusDetail: status.statusDetail });
      if (status.status === 'Indexed') {
        this.pages.set(await firstValueFrom(this.api.getDocumentContent(this.id())));
        return;
      }
      if (status.status === 'Failed') return;
      await sleep(1000);
    }
  }

  protected async remove(): Promise<void> {
    if (!confirm(this.t().doc.deleteConfirm)) return;
    try {
      await firstValueFrom(this.api.deleteDocument(this.id()));
      await this.store.refresh();
      await this.router.navigate(['/library']);
    } catch {
      /* ignore */
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
