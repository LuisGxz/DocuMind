import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { parseApiError } from '../../core/api-error';
import { STATUS_BADGE } from '../../core/i18n';
import { WorkspaceStore } from '../../core/workspace.store';
import { DocumentSummaryDto, FileKind } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { UploadDialogComponent } from './upload-dialog.component';

const FILE_ICON: Record<FileKind, string> = {
  pdf: 'file-text',
  word: 'file-text',
  spreadsheet: 'file-spreadsheet',
  markdown: 'file',
  text: 'file',
};

@Component({
  selector: 'dm-library',
  imports: [RouterLink, IconComponent, UploadDialogComponent],
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
          @if (isOwner()) {
            <button class="btn btn-primary" (click)="uploadOpen.set(true)">
              <dm-icon name="upload" [size]="16" /> {{ t().library.upload }}
            </button>
          }
        </header>

        <!-- how to explore (role-aware, cross-role first) -->
        <div class="explore">
          <div class="explore-main">
            <span class="explore-mark ai-grad"><dm-icon name="help-circle" [size]="16" /></span>
            <div>
              <p class="explore-title">{{ t().demo.crossRoleTitle }}</p>
              <p class="explore-body">{{ t().demo.crossRole }}</p>
            </div>
          </div>
          <p class="explore-can">
            <dm-icon name="check" [size]="14" />
            {{ isOwner() ? t().demo.canOwner : t().demo.canViewer }}
          </p>
        </div>

        @if (documents().length === 0) {
          <div class="state empty">
            <span class="empty-mark ai-grad"><dm-icon name="file-stack" [size]="26" /></span>
            <h3>{{ t().library.empty }}</h3>
            <p>{{ isOwner() ? t().library.emptyHint : t().library.viewerNoUpload }}</p>
          </div>
        } @else {
          <div class="grid">
            @for (doc of documents(); track doc.id) {
              <a
                class="card dcard"
                [class.hot]="doc.conversationCount > 0"
                [routerLink]="['/d', doc.id]"
              >
                <div class="doc-top">
                  <span class="ficon" [class.hot]="doc.conversationCount > 0">
                    <dm-icon [name]="fileIcon(doc.fileKind)" [size]="18" />
                  </span>
                  <span class="badge" [class]="statusBadge(doc)">{{ lang.status(doc.status) }}</span>
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
              </a>
            }
          </div>
        }
      }
    </div>

    @if (uploadOpen() && workspace(); as ws) {
      <dm-upload-dialog
        [slug]="ws.slug"
        (close)="uploadOpen.set(false)"
        (uploaded)="onUploaded()"
      />
    }
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
      margin-bottom: 1.25rem;
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

    .explore {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem 1.5rem;
      background: var(--aiblue-50);
      border: 1px solid var(--aiblue-100);
      border-radius: var(--radius-lg);
      padding: 0.85rem 1rem;
      margin-bottom: 1.5rem;
    }
    .explore-main {
      display: flex;
      gap: 0.7rem;
      align-items: flex-start;
      flex: 1;
      min-width: 16rem;
    }
    .explore-mark {
      width: 1.9rem;
      height: 1.9rem;
      display: grid;
      place-items: center;
      border-radius: 0.6rem;
      color: #fff;
      flex-shrink: 0;
    }
    .explore-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ink-900);
    }
    .explore-body {
      font-size: 0.82rem;
      color: var(--ink-700);
      margin-top: 0.15rem;
      line-height: 1.5;
    }
    .explore-can {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--aiblue-600);
      white-space: nowrap;
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
  private readonly store = inject(WorkspaceStore);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly uploadOpen = signal(false);
  private readonly docs = signal<DocumentSummaryDto[]>([]);

  protected readonly workspace = this.store.primary;
  protected readonly isOwner = computed(() => this.store.role() === 'Owner');

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
      await this.store.ensureLoaded();
      const ws = this.store.primary();
      if (ws) this.docs.set(await firstValueFrom(this.api.getDocuments(ws.slug)));
    } catch (err) {
      this.error.set(parseApiError(err, this.t().library.loadError)[0]);
    } finally {
      this.loading.set(false);
    }
  }

  protected async onUploaded(): Promise<void> {
    await this.store.refresh();
    const ws = this.store.primary();
    if (ws) this.docs.set(await firstValueFrom(this.api.getDocuments(ws.slug)));
  }

  protected fileIcon(kind: FileKind): string {
    return FILE_ICON[kind] ?? 'file';
  }
  protected statusBadge(status: DocumentSummaryDto['status'] | DocumentSummaryDto): string {
    const s = typeof status === 'string' ? status : status.status;
    return STATUS_BADGE[s];
  }
}
