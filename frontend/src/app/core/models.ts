// Mirrors the NestJS backend DTOs (DocuMind API). Keep in sync with backend/src/**.

export type Role = 'Owner' | 'Viewer';
export type DocumentStatus = 'Queued' | 'Processing' | 'Indexed' | 'Failed';
export type FileKind = 'pdf' | 'word' | 'spreadsheet' | 'markdown' | 'text';
export type MessageRole = 'user' | 'assistant';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
}

export interface WorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  nameEs: string | null;
  description: string | null;
  descriptionEs: string | null;
  role: Role;
  documentCount: number;
  indexedPageCount: number;
  createdAt: string;
}

export interface DocumentSummaryDto {
  id: string;
  filename: string;
  fileKind: FileKind;
  sizeBytes: number;
  pageCount: number;
  status: DocumentStatus;
  progressPages: number;
  chunkCount: number;
  conversationCount: number;
  hasSummary: boolean;
  uploadedByName: string;
  createdAt: string;
  indexedAt: string | null;
}

export interface DocumentDetailDto extends DocumentSummaryDto {
  statusDetail: string | null;
  summary: string | null;
  summaryEs: string | null;
}

export interface DocumentStatusDto {
  id: string;
  status: DocumentStatus;
  statusDetail: string | null;
  progressPages: number;
  pageCount: number;
  chunkCount: number;
  indexedAt: string | null;
}

export interface DocumentPage {
  page: number;
  text: string;
}

export interface Citation {
  chunkId: string;
  page: number;
  quote: string;
}

export interface ChatMessageDto {
  id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  createdAt: string;
}

export interface ConversationSummaryDto {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetailDto extends ConversationSummaryDto {
  documentId: string;
  messages: ChatMessageDto[];
}

/** Events streamed over SSE by POST /documents/:id/chat. */
export type ChatStreamEvent =
  | { type: 'meta'; conversationId: string; title: string }
  | { type: 'token'; text: string }
  | { type: 'sources'; citations: Citation[] }
  | { type: 'done'; messageId: string }
  | { type: 'error'; message: string };
