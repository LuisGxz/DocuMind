import { Injectable, inject } from '@angular/core';
import { API_BASE } from './config';
import { AuthService } from './auth.service';
import { ChatStreamEvent } from './models';

/**
 * Streams the RAG chat over Server-Sent Events. The Angular HttpClient can't
 * surface a token stream, so we use fetch + ReadableStream directly and parse
 * `data: {…}` frames. Auth is attached manually (outside the HTTP interceptor),
 * with a single transparent refresh-and-retry on a 401.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly auth = inject(AuthService);

  async *stream(
    documentId: string,
    question: string,
    conversationId: string | null,
    signal: AbortSignal,
  ): AsyncGenerator<ChatStreamEvent> {
    let response = await this.open(documentId, question, conversationId, signal);

    if (response.status === 401 && (await this.auth.tryRefresh())) {
      response = await this.open(documentId, question, conversationId, signal);
    }

    if (!response.ok || !response.body) {
      yield { type: 'error', message: await this.errorMessage(response) };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line.
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const line = frame.split('\n').find((l) => l.startsWith('data:'));
        if (!line) continue;
        try {
          yield JSON.parse(line.slice(5).trim()) as ChatStreamEvent;
        } catch {
          /* ignore malformed frame */
        }
      }
    }
  }

  private open(
    documentId: string,
    question: string,
    conversationId: string | null,
    signal: AbortSignal,
  ): Promise<Response> {
    const token = this.auth.accessToken;
    return fetch(`${API_BASE}/documents/${documentId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question, ...(conversationId ? { conversationId } : {}) }),
      signal,
    });
  }

  private async errorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { detail?: string; title?: string };
      return body.detail ?? body.title ?? 'The answer could not be generated.';
    } catch {
      return 'The answer could not be generated.';
    }
  }
}
