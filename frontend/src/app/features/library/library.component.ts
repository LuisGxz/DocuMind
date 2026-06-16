import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { parseApiError } from '../../core/api-error';
import { STATUS_BADGE } from '../../core/i18n';
import { DocumentSummaryDto, FileKind, WorkspaceSummary } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

const FILE_ICON: Record<FileKind, string> = {
  pdf: 'file-text',
  word: 'file-text',
  spreadsheet: 'file-spreadsheet',
  markdown: 'file',
  text: 'file',
};

@Component({
  selector: 'dm-library',
  imports: [IconComponent],
  template: `
    <div class="container page">
      @if (loading()) {
        <div class="head-skel">
          <div class="skeleton" style="height:1.6rem;width:14rem"></div>
          <div class="skeleton" style="height:1rem;width:9rem;margin-top:.6rem"></div>
        </div>
        <div class="grid">
          @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
            <div class="card doc-skel">
              <div class="skeleton" style="height:2.5rem;width:2.5rem;border-radius:.75rem"></div>
              <div class="skeleton" style="height:.9rem;width:90%;margin-top:1rem"></div>
              <div class="skeleton" style="height:.7rem;width:55%;margin-top:.6rem"></div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="state">
          <dm-icon name="alert-triangle" [size]="28" />
          <p>{{ error() }}</p>
          <button class="btn btn-ghost" (click)="reload()">{{ t().common.retry }}</button>
        </div>
      } @else if (workspace(); as ws) {
        <header class="head">
          <div>
            <h1>{{ lang.pick(ws.name, ws.nameEs) }}</h1>
            <p class="counts num">
              {{ ws.documentCount }} {{ t().library.docCount }} ·
              {{ ws.indexedPageCount }} {{ t().library.pageCount }}
            </p>
          </div>
        </header>

        @if (documents().length === 0) {
          <div class="state empty">
            <span class="empty-mark ai-grad"><dm-icon name="file-stack" [size]="26" /></span>
            <h3>{{ t().library.empty }}</h3>
            <p>{{ t().library.emptyHint }}</p>
          </div>
        } @else {
          <div class="grid">
            @for (doc of documents(); track doc.id) {
              <article class="card dcard" [class.hot]="doc.conversationCount > 0">
                <div class="doc-top">
                  <span class="ficon" [class.hot]="doc.conversationCount > 0">
                    <dm-icon [name]="fileIcon(doc.fileKind)" [size]="18" />
                  </span>
                  <span class="badge" [class]="statusBadge(doc.status)">{{ lang.status(doc.status) }}</span>
                </div>
                <p class="name" [title]="doc.filename">{{ doc.filename }}</p>
                <p class="meta num">
                  {{ doc.pageCount }} {{ t().common.pages }} · {{ lang.fileKind(doc.fileKind) }}
                </p>
                <div class="foot">
                  <span class="convos num" [class.has]="doc.conversationCount > 0">
                    <dm-icon name="message-square" [size]="13" />
                    {{ doc.conversationCount }} {{ t().library.conversations }}
                  </span>
                  <span class="by">{{ t().library.uploadedBy }} {{ doc.uploadedByName }}</span>
                </div>
              </article>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .page {
      padding-block: 2rem 1rem;
    }
    .head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .head h1 {
      font-size: 1.5rem;
    }
    .counts {
      margin-top: 0.35rem;
      color: var(--ink-500);
      font-size: 0.875rem;
    }
    .head-skel {
      margin-bottom: 1.5rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
      gap: 1rem;
    }
    .dcard {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      transition:
        box-shadow 150ms ease,
        transform 120ms ease,
        border-color 150ms ease;
    }
    .dcard.hot {
      border-color: var(--aiblue-500);
    }
    .dcard:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .doc-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.85rem;
    }
    .ficon {
      width: 2.5rem;
      height: 2.5rem;
      display: grid;
      place-items: center;
      border-radius: 0.75rem;
      background: var(--ink-100);
      color: var(--ink-500);
    }
    .ficon.hot {
      background: var(--aiblue-100);
      color: var(--aiblue-600);
    }
    .name {
      font-size: 0.9rem;
      font-weight: 600;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }
    .meta {
      margin-top: 0.45rem;
      font-size: 0.78rem;
      color: var(--ink-400);
    }
    .foot {
      margin-top: 0.9rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-soft);
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .convos {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.76rem;
      color: var(--ink-400);
    }
    .convos.has {
      color: var(--aiblue-600);
      font-weight: 600;
    }
    .by {
      font-size: 0.74rem;
      color: var(--ink-400);
    }
    .doc-skel {
      padding: 1rem;
    }

    /* ---- states ---- */
    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
      padding: 4rem 1rem;
      color: var(--ink-500);
    }
    .empty .empty-mark {
      width: 3.5rem;
      height: 3.5rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      color: #fff;
      margin-bottom: 0.25rem;
    }
    .empty h3 {
      font-size: 1.1rem;
      color: var(--ink-900);
    }
    .empty p {
      max-width: 24rem;
    }
  `,
})
export class LibraryComponent {
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly workspace = signal<WorkspaceSummary | null>(null);
  private readonly docs = signal<DocumentSummaryDto[]>([]);

  /** Newest first. */
  protected readonly documents = computed(() =>
    [...this.docs()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  );

  constructor() {
    void this.reload();
  }

  protected reload(): Promise<void> {
    return this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const workspaces = await firstValueFrom(this.api.getWorkspaces());
      const ws = workspaces[0] ?? null;
      this.workspace.set(ws);
      if (ws) {
        this.docs.set(await firstValueFrom(this.api.getDocuments(ws.slug)));
      }
    } catch (err) {
      this.error.set(parseApiError(err, this.t().library.loadError)[0]);
    } finally {
      this.loading.set(false);
    }
  }

  protected fileIcon(kind: FileKind): string {
    return FILE_ICON[kind] ?? 'file';
  }
  protected statusBadge(status: DocumentSummaryDto['status']): string {
    return STATUS_BADGE[status];
  }
}
