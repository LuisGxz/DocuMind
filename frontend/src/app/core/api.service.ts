import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE } from './config';
import {
  ConversationDetailDto,
  ConversationSummaryDto,
  DocumentDetailDto,
  DocumentPage,
  DocumentStatusDto,
  DocumentSummaryDto,
  WorkspaceSummary,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ---- Workspaces ----
  getWorkspaces() {
    return this.http.get<WorkspaceSummary[]>(`${API_BASE}/workspaces`);
  }
  getWorkspace(slug: string) {
    return this.http.get<WorkspaceSummary>(`${API_BASE}/workspaces/${slug}`);
  }

  // ---- Documents ----
  getDocuments(slug: string) {
    return this.http.get<DocumentSummaryDto[]>(`${API_BASE}/workspaces/${slug}/documents`);
  }
  getDocument(id: string) {
    return this.http.get<DocumentDetailDto>(`${API_BASE}/documents/${id}`);
  }
  getDocumentStatus(id: string) {
    return this.http.get<DocumentStatusDto>(`${API_BASE}/documents/${id}/status`);
  }
  getDocumentContent(id: string) {
    return this.http.get<DocumentPage[]>(`${API_BASE}/documents/${id}/content`);
  }
  uploadDocument(slug: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<DocumentDetailDto>(`${API_BASE}/workspaces/${slug}/documents`, form);
  }
  reprocessDocument(id: string) {
    return this.http.post<DocumentStatusDto>(`${API_BASE}/documents/${id}/reprocess`, {});
  }
  deleteDocument(id: string) {
    return this.http.delete<void>(`${API_BASE}/documents/${id}`);
  }

  // ---- RAG ----
  getSuggestedQuestions(id: string) {
    return this.http.get<{ questions: string[] }>(`${API_BASE}/documents/${id}/suggested-questions`);
  }

  // ---- Conversations ----
  getConversations(documentId: string) {
    return this.http.get<ConversationSummaryDto[]>(
      `${API_BASE}/documents/${documentId}/conversations`,
    );
  }
  createConversation(documentId: string, title?: string) {
    return this.http.post<ConversationSummaryDto>(
      `${API_BASE}/documents/${documentId}/conversations`,
      title ? { title } : {},
    );
  }
  getConversation(id: string) {
    return this.http.get<ConversationDetailDto>(`${API_BASE}/conversations/${id}`);
  }
  renameConversation(id: string, title: string) {
    return this.http.patch<ConversationSummaryDto>(`${API_BASE}/conversations/${id}`, { title });
  }
  deleteConversation(id: string) {
    return this.http.delete<void>(`${API_BASE}/conversations/${id}`);
  }
}
