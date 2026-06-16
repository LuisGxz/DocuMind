import { Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { parseApiError } from '../../core/api-error';
import { DocumentStatus } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

type Phase = 'pick' | 'working' | 'done' | 'error';

@Component({
  selector: 'dm-upload-dialog',
  imports: [IconComponent],
  template: `
    <div class="backdrop" (click)="onBackdrop($event)">
      <div class="modal card" role="dialog" aria-modal="true">
        <div class="mhead">
          <h3>{{ t().upload.title }}</h3>
          <button class="btn btn-subtle icon-btn" (click)="close.emit()" [title]="t().common.close">
            <dm-icon name="x" [size]="18" />
          </button>
        </div>

        @if (phase() === 'pick') {
          <div
            class="drop"
            [class.over]="dragOver()"
            (dragover)="onDrag($event, true)"
            (dragleave)="onDrag($event, false)"
            (drop)="onDrop($event)"
            (click)="fileEl.click()"
          >
            <span class="drop-mark ai-grad"><dm-icon name="upload" [size]="22" /></span>
            <p class="drop-main">{{ t().upload.drop }}</p>
            <p class="drop-or">{{ t().upload.or }} <span class="link">{{ t().upload.choose }}</span></p>
            <p class="drop-hint num">{{ t().upload.accept }} · {{ t().upload.maxSize }}</p>
          </div>
          <input
            #fileEl
            type="file"
            accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
            hidden
            (change)="onPick($event)"
          />
        } @else if (phase() === 'working') {
          <div class="working">
            <div class="wrow">
              <dm-icon [name]="status() === 'Queued' ? 'clock' : 'loader'" [size]="18" [class.spin]="status() === 'Processing'" />
              <span class="wname">{{ filename() }}</span>
            </div>
            <div class="bar"><div class="fill ai-grad" [style.width.%]="progress()"></div></div>
            <p class="wstatus num">{{ phaseLabel() }}</p>
          </div>
        } @else if (phase() === 'done') {
          <div class="done">
            <span class="done-mark"><dm-icon name="check-circle" [size]="26" /></span>
            <p class="done-main">{{ t().upload.indexed }}</p>
            <p class="done-hint">{{ t().upload.readyHint }}</p>
            <div class="done-actions">
              <button class="btn btn-ghost" (click)="reset()">{{ t().upload.addAnother }}</button>
              <button class="btn btn-primary" (click)="openDoc()">{{ t().upload.openDoc }}</button>
            </div>
          </div>
        } @else {
          <div class="errbox">
            <div class="alert alert-danger">
              <dm-icon name="alert-triangle" [size]="18" />
              <span>{{ errorMsg() }}</span>
            </div>
            <button class="btn btn-ghost" (click)="reset()">{{ t().common.retry }}</button>
          </div>
        }

        <div class="encrypted">
          <dm-icon name="shield-check" [size]="15" />
          <span>{{ t().upload.encrypted }}</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 60;
      background: rgba(26, 29, 38, 0.45);
      display: grid;
      place-items: center;
      padding: 1rem;
      animation: fade 150ms ease;
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    .modal {
      width: 100%;
      max-width: 27rem;
      padding: 1.25rem;
      box-shadow: var(--shadow-pop);
    }
    .mhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .mhead h3 {
      font-size: 1.05rem;
    }
    .icon-btn {
      padding: 0.4rem;
    }
    .drop {
      border: 2px dashed var(--border);
      border-radius: var(--radius-lg);
      padding: 2rem 1rem;
      text-align: center;
      cursor: pointer;
      transition:
        border-color 150ms ease,
        background 150ms ease;
    }
    .drop:hover,
    .drop.over {
      border-color: var(--aiblue-500);
      background: var(--aiblue-50);
    }
    .drop-mark {
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: 0.85rem;
      color: #fff;
      margin: 0 auto 0.75rem;
    }
    .drop-main {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .drop-or {
      font-size: 0.85rem;
      color: var(--ink-500);
      margin-top: 0.25rem;
    }
    .drop-or .link {
      color: var(--aiblue-600);
      font-weight: 600;
    }
    .drop-hint {
      font-size: 0.75rem;
      color: var(--ink-400);
      margin-top: 0.6rem;
    }

    .working {
      padding: 0.5rem 0 0.25rem;
    }
    .wrow {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--aiblue-600);
      margin-bottom: 0.7rem;
    }
    .wname {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--ink-900);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bar {
      height: 0.5rem;
      border-radius: var(--radius-pill);
      background: var(--ink-100);
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: var(--radius-pill);
      transition: width 400ms ease;
    }
    .wstatus {
      margin-top: 0.6rem;
      font-size: 0.8rem;
      color: var(--ink-500);
    }

    .done {
      text-align: center;
      padding: 0.5rem 0;
    }
    .done-mark {
      color: var(--ok);
      display: inline-grid;
      place-items: center;
      margin-bottom: 0.5rem;
    }
    .done-main {
      font-weight: 600;
    }
    .done-hint {
      font-size: 0.85rem;
      color: var(--ink-500);
      margin-top: 0.25rem;
    }
    .done-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 1rem;
    }
    .errbox {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .encrypted {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border-soft);
      font-size: 0.76rem;
      color: var(--ink-400);
    }
  `,
})
export class UploadDialogComponent {
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly slug = input.required<string>();
  readonly close = output<void>();
  readonly uploaded = output<void>();

  protected readonly phase = signal<Phase>('pick');
  protected readonly filename = signal('');
  protected readonly status = signal<DocumentStatus>('Queued');
  protected readonly progress = signal(0);
  protected readonly errorMsg = signal('');
  protected readonly dragOver = signal(false);
  private docId = '';

  protected onDrag(e: DragEvent, over: boolean): void {
    e.preventDefault();
    this.dragOver.set(over);
  }
  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) void this.upload(file);
  }
  protected onPick(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) void this.upload(file);
  }
  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget && this.phase() !== 'working') this.close.emit();
  }

  protected phaseLabel(): string {
    if (this.status() === 'Queued') return this.t().upload.queued;
    return this.t().upload.processing;
  }

  private async upload(file: File): Promise<void> {
    this.filename.set(file.name);
    this.phase.set('working');
    this.status.set('Queued');
    this.progress.set(8);
    try {
      const doc = await firstValueFrom(this.api.uploadDocument(this.slug(), file));
      this.docId = doc.id;
      await this.poll();
    } catch (err) {
      this.errorMsg.set(parseApiError(err, this.t().upload.errorFallback)[0]);
      this.phase.set('error');
    }
  }

  private async poll(): Promise<void> {
    for (let i = 0; i < 60; i++) {
      const s = await firstValueFrom(this.api.getDocumentStatus(this.docId));
      this.status.set(s.status);
      if (s.status === 'Processing') {
        const pct = s.pageCount ? Math.round((s.progressPages / s.pageCount) * 100) : 40;
        this.progress.set(Math.max(20, Math.min(95, pct)));
      }
      if (s.status === 'Indexed') {
        this.progress.set(100);
        this.phase.set('done');
        this.uploaded.emit();
        return;
      }
      if (s.status === 'Failed') {
        this.errorMsg.set(this.t().upload.failed);
        this.phase.set('error');
        return;
      }
      await sleep(900);
    }
  }

  protected reset(): void {
    this.phase.set('pick');
    this.progress.set(0);
    this.errorMsg.set('');
  }

  protected async openDoc(): Promise<void> {
    this.close.emit();
    await this.router.navigate(['/d', this.docId]);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
