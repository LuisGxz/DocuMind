import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Citation, ConversationTurn } from '../generation/answer-generator';

export interface ConversationSummaryDto {
  id: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageDto {
  id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  createdAt: Date;
}

export interface ConversationDetailDto extends ConversationSummaryDto {
  documentId: string;
  messages: ChatMessageDto[];
}

/**
 * Conversations are private per (document, user): every read/write is scoped by
 * `userId`, so a missing row is a 404 rather than a leak. The RAG service drives
 * the write path (persisting user/assistant turns); the controller exposes the
 * list/detail/rename/delete surface.
 */
@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForDocument(
    documentId: string,
    userId: string,
  ): Promise<ConversationSummaryDto[]> {
    const rows = await this.prisma.conversation.findMany({
      where: { documentId, userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
    return rows.map((c) => ({
      id: c.id,
      title: c.title,
      messageCount: c._count.messages,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async getDetail(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDetailDto> {
    const convo = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!convo) throw new NotFoundException('Conversation not found.');
    return {
      id: convo.id,
      documentId: convo.documentId,
      title: convo.title,
      messageCount: convo._count.messages,
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt,
      messages: convo.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: toCitations(m.citations),
        createdAt: m.createdAt,
      })),
    };
  }

  async create(
    documentId: string,
    userId: string,
    title: string,
  ): Promise<ConversationSummaryDto> {
    const convo = await this.prisma.conversation.create({
      data: {
        documentId,
        userId,
        title: title.slice(0, 120) || 'New conversation',
      },
    });
    return {
      id: convo.id,
      title: convo.title,
      messageCount: 0,
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt,
    };
  }

  /** Resolve a conversation the caller owns, optionally pinned to a document. */
  async getOwned(
    conversationId: string,
    userId: string,
    documentId?: string,
  ): Promise<{ id: string; title: string }> {
    const convo = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId, documentId },
      select: { id: true, title: true },
    });
    if (!convo) throw new NotFoundException('Conversation not found.');
    return convo;
  }

  async rename(
    conversationId: string,
    userId: string,
    title: string,
  ): Promise<ConversationSummaryDto> {
    await this.assertOwned(conversationId, userId);
    const convo = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title: title.slice(0, 120) },
      include: { _count: { select: { messages: true } } },
    });
    return {
      id: convo.id,
      title: convo.title,
      messageCount: convo._count.messages,
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt,
    };
  }

  async remove(conversationId: string, userId: string): Promise<void> {
    await this.assertOwned(conversationId, userId);
    await this.prisma.conversation.delete({ where: { id: conversationId } });
  }

  async addMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
    citations: Citation[] | null,
  ): Promise<ChatMessageDto> {
    const msg = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role,
        content,
        citations: citations
          ? (citations as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
    return {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      citations: toCitations(msg.citations),
      createdAt: msg.createdAt,
    };
  }

  /** Recent turns (oldest-first) to give the generator short-term context. */
  async recentHistory(
    conversationId: string,
    limit: number,
  ): Promise<ConversationTurn[]> {
    const rows = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { role: true, content: true },
    });
    return rows.reverse().map((m) => ({ role: m.role, content: m.content }));
  }

  touch(conversationId: string): Promise<unknown> {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  private async assertOwned(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const exists = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Conversation not found.');
  }
}

function toCitations(value: Prisma.JsonValue | null): Citation[] {
  if (!Array.isArray(value)) return [];
  return value as unknown as Citation[];
}
