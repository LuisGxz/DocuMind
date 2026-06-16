import { Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ChatService } from '../../core/chat.service';
import { LanguageService } from '../../core/language.service';
import { parseApiError } from '../../core/api-error';
import { ChatMessageDto, Citation, ConversationSummaryDto } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'dm-chat-panel',
  imports: [FormsModule, IconComponent],
  template: `
    <div class="chat">
      <!-- header -->
      <div class="chead">
        <span class="mark ai-grad"><dm-icon name="sparkles" [size]="14" /></span>
        <div class="ctitle">
          <span class="t">{{ t().chat.title }}</span>
          <span class="sub num">{{ pageCount() }} {{ t().doc.pagesIndexed }}</span>
        </div>
        <div class="cactions">
          <button
            class="btn btn-subtle icon-btn"
            (click)="toggleConvos()"
            [title]="t().convos.title"
            [class.on]="convosOpen()"
          >
            <dm-icon name="message-square" [size]="18" />
          </button>
          <button class="btn btn-subtle icon-btn" (click)="newChat()" [title]="t().chat.newChat">
            <dm-icon name="plus" [size]="18" />
          </button>
        </div>

        @if (convosOpen()) {
          <div class="convos card">
            <div class="convos-head">
              <span>{{ t().convos.title }}</span>
              <button class="btn btn-subtle icon-btn" (click)="convosOpen.set(false)">
                <dm-icon name="x" [size]="16" />
              </button>
            </div>
            @if (conversations().length === 0) {
              <p class="convos-empty">{{ t().convos.empty }}</p>
            } @else {
              <ul>
                @for (c of conversations(); track c.id) {
                  <li [class.active]="c.id === conversationId()">
                    <button class="convo-pick" (click)="openConversation(c.id)">
                      <span class="convo-title">{{ c.title }}</span>
                      <span class="convo-meta num">{{ c.messageCount }} {{ t().convos.messages }}</span>
                    </button>
                    <button
                      class="btn btn-subtle icon-btn sm"
                      (click)="removeConversation(c)"
                      [title]="t().convos.delete"
                    >
                      <dm-icon name="trash" [size]="14" />
                    </button>
                  </li>
                }
              </ul>
            }
          </div>
        }
      </div>

      <!-- messages -->
      <div class="cbody" #body>
        @if (messages().length === 0 && !streaming()) {
          <div class="empty">
            <span class="empty-mark ai-grad"><dm-icon name="sparkles" [size]="22" /></span>
            <h3>{{ t().chat.emptyTitle }}</h3>
            <p>{{ t().chat.emptyHint }}</p>
          </div>
        }

        @for (m of messages(); track m.id) {
          @if (m.role === 'user') {
            <div class="row user">
              <div class="bubble">{{ m.content }}</div>
            </div>
          } @else {
            <div class="row ai">
              <span class="amark ai-grad"><dm-icon name="sparkles" [size]="13" /></span>
              <div class="answer">
                <p class="atext">{{ m.content }}</p>
                @if (m.citations.length) {
                  <div class="sources">
                    <span class="src-label">{{ t().chat.sources }}</span>
                    @for (c of m.citations; track c.chunkId) {
                      <button
                        class="cite-chip"
                        (mouseenter)="activeChunk.emit(c.chunkId)"
                        (mouseleave)="activeChunk.emit(null)"
                        (focus)="activeChunk.emit(c.chunkId)"
                        (blur)="activeChunk.emit(null)"
                        (click)="showCitations(m.citations); activeChunk.emit(c.chunkId)"
                        [title]="c.quote"
                      >
                        <dm-icon name="file-text" [size]="12" /> {{ t().doc.page }} {{ c.page }}
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }
        }

        @if (streaming()) {
          <div class="row ai">
            <span class="amark ai-grad"><dm-icon name="sparkles" [size]="13" /></span>
            <div class="answer">
              @if (streamText()) {
                <p class="atext">{{ streamText() }}<span class="caret"></span></p>
              } @else {
                <p class="thinking">
                  <dm-icon name="loader" [size]="15" class="spin" /> {{ t().chat.thinking }}
                </p>
              }
            </div>
          </div>
        }

        @if (error()) {
          <div class="alert alert-danger">
            <dm-icon name="alert-triangle" [size]="16" />
            <span>{{ error() }}</span>
          </div>
        }
      </div>

      <!-- composer -->
      <div class="composer">
        @if (suggested().length && messages().length === 0) {
          <div class="chips">
            @for (q of suggested(); track q) {
              <button class="chip" (click)="ask(q)" [disabled]="streaming()">{{ q }}</button>
            }
          </div>
        }
        <form class="inputbar" (ngSubmit)="ask(draft)">
          <input
            class="cinput"
            [placeholder]="t().chat.placeholder"
            [(ngModel)]="draft"
            name="q"
            autocomplete="off"
            [disabled]="streaming()"
          />
          <button
            class="send ai-grad"
            type="submit"
            [disabled]="streaming() || !draft.trim()"
            [title]="t().chat.send"
          >
            <dm-icon name="arrow-up" [size]="18" />
          </button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .chat {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    .chead {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.7rem 1rem;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
    .mark {
      width: 1.6rem;
      height: 1.6rem;
      display: grid;
      place-items: center;
      border-radius: 0.5rem;
      color: #fff;
      flex-shrink: 0;
    }
    .ctitle {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      min-width: 0;
    }
    .ctitle .t {
      font-size: 0.85rem;
      font-weight: 600;
    }
    .ctitle .sub {
      font-size: 0.72rem;
      color: var(--ink-400);
    }
    .cactions {
      margin-left: auto;
      display: flex;
      gap: 0.2rem;
    }
    .icon-btn {
      padding: 0.4rem;
    }
    .icon-btn.on {
      background: var(--aiblue-50);
      color: var(--aiblue-600);
    }
    .icon-btn.sm {
      padding: 0.3rem;
    }

    /* conversations dropdown */
    .convos {
      position: absolute;
      top: calc(100% + 6px);
      right: 0.75rem;
      width: 17rem;
      z-index: 20;
      box-shadow: var(--shadow-pop);
      padding: 0.5rem;
    }
    .convos-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ink-400);
      padding: 0.2rem 0.4rem 0.4rem;
    }
    .convos-empty {
      padding: 0.5rem;
      font-size: 0.82rem;
      color: var(--ink-400);
    }
    .convos ul {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 16rem;
      overflow-y: auto;
    }
    .convos li {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: var(--radius-sm);
    }
    .convos li.active {
      background: var(--aiblue-50);
    }
    .convo-pick {
      flex: 1;
      min-width: 0;
      text-align: left;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .convo-title {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--ink-900);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .convo-meta {
      font-size: 0.7rem;
      color: var(--ink-400);
    }

    /* body */
    .cbody {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .empty {
      margin: auto;
      text-align: center;
      color: var(--ink-500);
      max-width: 20rem;
    }
    .empty-mark {
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: 0.85rem;
      color: #fff;
      margin: 0 auto 0.75rem;
    }
    .empty h3 {
      font-size: 1rem;
    }
    .empty p {
      margin-top: 0.35rem;
      font-size: 0.85rem;
    }

    .row {
      display: flex;
      gap: 0.6rem;
    }
    .row.user {
      justify-content: flex-end;
    }
    .bubble {
      max-width: 85%;
      background: var(--ink-900);
      color: #fff;
      font-size: 0.875rem;
      line-height: 1.5;
      padding: 0.7rem 0.9rem;
      border-radius: 1rem 1rem 0.25rem 1rem;
    }
    .amark {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 0.5rem;
      display: grid;
      place-items: center;
      color: #fff;
      flex-shrink: 0;
      margin-top: 0.15rem;
    }
    .answer {
      max-width: 85%;
    }
    .atext {
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--ink-900);
      white-space: pre-wrap;
    }
    .thinking {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
      color: var(--ink-500);
    }
    .sources {
      margin-top: 0.65rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
    }
    .src-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ink-400);
    }
    .cite-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--aiblue-600);
      background: var(--aiblue-100);
      border: 1px solid transparent;
      border-radius: var(--radius-pill);
      padding: 0.18rem 0.55rem;
      cursor: pointer;
      transition:
        background 150ms ease,
        border-color 150ms ease;
    }
    .cite-chip:hover,
    .cite-chip:focus-visible {
      background: var(--cite);
      border-color: var(--cite-hot);
      color: var(--ink-900);
    }

    /* composer */
    .composer {
      border-top: 1px solid var(--border);
      padding: 0.85rem 1rem 1rem;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.7rem;
    }
    .chip {
      font-size: 0.76rem;
      font-weight: 500;
      color: var(--ink-700);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      padding: 0.35rem 0.7rem;
      cursor: pointer;
      transition:
        border-color 150ms ease,
        color 150ms ease;
    }
    .chip:not(:disabled):hover {
      border-color: var(--aiblue-500);
      color: var(--aiblue-600);
    }
    .inputbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 0.35rem 0.4rem 0.35rem 0.85rem;
      background: var(--surface);
      transition: border-color 150ms ease;
    }
    .inputbar:focus-within {
      border-color: var(--aiblue-500);
    }
    .cinput {
      flex: 1;
      border: none;
      outline: none;
      font: inherit;
      font-size: 0.875rem;
      background: transparent;
      color: var(--ink-900);
    }
    .cinput::placeholder {
      color: var(--ink-400);
    }
    .send {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-sm);
      border: none;
      color: #fff;
      display: grid;
      place-items: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: opacity 150ms ease;
    }
    .send:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `,
})
export class ChatPanelComponent {
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  private readonly api = inject(ApiService);
  private readonly chat = inject(ChatService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly documentId = input.required<string>();
  readonly pageCount = input<number>(0);

  /** Latest answer's citations to render in the viewer. */
  readonly citations = output<Citation[]>();
  /** Hovered/focused citation chunk to highlight (null clears). */
  readonly activeChunk = output<string | null>();

  protected draft = '';
  protected readonly messages = signal<ChatMessageDto[]>([]);
  protected readonly streaming = signal(false);
  protected readonly streamText = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly suggested = signal<string[]>([]);
  protected readonly conversations = signal<ConversationSummaryDto[]>([]);
  protected readonly conversationId = signal<string | null>(null);
  protected readonly convosOpen = signal(false);

  private controller: AbortController | null = null;
  private loadedFor = '';

  constructor() {
    // React to the document id arriving (signal input) once.
    queueMicrotask(() => this.init());
  }

  private async init(): Promise<void> {
    const id = this.documentId();
    if (!id || this.loadedFor === id) return;
    this.loadedFor = id;
    try {
      const [suggested, convos] = await Promise.all([
        firstValueFrom(this.api.getSuggestedQuestions(id)),
        firstValueFrom(this.api.getConversations(id)),
      ]);
      this.suggested.set(suggested.questions);
      this.conversations.set(convos);
    } catch {
      /* suggestions/conversations are best-effort */
    }
  }

  protected ask(question: string): void {
    const q = question.trim();
    if (!q || this.streaming()) return;
    this.draft = '';
    this.error.set(null);
    void this.run(q);
  }

  private async run(question: string): Promise<void> {
    this.messages.update((m) => [
      ...m,
      { id: `u-${m.length}-${question.length}`, role: 'user', content: question, citations: [], createdAt: '' },
    ]);
    this.streaming.set(true);
    this.streamText.set('');
    this.scrollDown();

    let citations: Citation[] = [];
    this.controller = new AbortController();
    try {
      for await (const ev of this.chat.stream(
        this.documentId(),
        question,
        this.conversationId(),
        this.controller.signal,
      )) {
        if (ev.type === 'meta') {
          this.conversationId.set(ev.conversationId);
        } else if (ev.type === 'token') {
          this.streamText.update((s) => s + ev.text);
          this.scrollDown();
        } else if (ev.type === 'sources') {
          citations = ev.citations;
          this.citations.emit(citations);
        } else if (ev.type === 'done') {
          this.messages.update((m) => [
            ...m,
            { id: ev.messageId, role: 'assistant', content: this.streamText(), citations, createdAt: '' },
          ]);
          void this.refreshConversations();
        } else if (ev.type === 'error') {
          this.error.set(ev.message || this.t().chat.errorAnswer);
        }
      }
    } catch (err) {
      this.error.set(parseApiError(err, this.t().chat.errorAnswer)[0]);
    } finally {
      this.streaming.set(false);
      this.streamText.set('');
      this.controller = null;
      this.scrollDown();
    }
  }

  protected toggleConvos(): void {
    this.convosOpen.update((v) => !v);
  }

  protected newChat(): void {
    this.cancel();
    this.conversationId.set(null);
    this.messages.set([]);
    this.error.set(null);
    this.citations.emit([]);
    this.activeChunk.emit(null);
    this.convosOpen.set(false);
  }

  protected async openConversation(id: string): Promise<void> {
    this.cancel();
    this.convosOpen.set(false);
    try {
      const detail = await firstValueFrom(this.api.getConversation(id));
      this.conversationId.set(detail.id);
      this.messages.set(detail.messages);
      const lastAi = [...detail.messages].reverse().find((m) => m.role === 'assistant');
      this.citations.emit(lastAi?.citations ?? []);
      this.activeChunk.emit(null);
      this.scrollDown();
    } catch {
      this.error.set(this.t().chat.errorAnswer);
    }
  }

  protected async removeConversation(c: ConversationSummaryDto): Promise<void> {
    if (!confirm(this.t().convos.deleteConfirm)) return;
    try {
      await firstValueFrom(this.api.deleteConversation(c.id));
      if (c.id === this.conversationId()) this.newChat();
      await this.refreshConversations();
    } catch {
      /* ignore */
    }
  }

  protected showCitations(citations: Citation[]): void {
    this.citations.emit(citations);
  }

  private async refreshConversations(): Promise<void> {
    try {
      this.conversations.set(await firstValueFrom(this.api.getConversations(this.documentId())));
    } catch {
      /* best-effort */
    }
  }

  private cancel(): void {
    this.controller?.abort();
    this.controller = null;
    this.streaming.set(false);
    this.streamText.set('');
  }

  private scrollDown(): void {
    queueMicrotask(() => {
      const body = this.host.nativeElement.querySelector('.cbody');
      if (body) body.scrollTop = body.scrollHeight;
    });
  }
}
