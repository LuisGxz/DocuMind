import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from '../ingestion/ingestion.service';

export type FileKind = 'pdf' | 'word' | 'spreadsheet' | 'markdown' | 'text';

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
  createdAt: Date;
  indexedAt: Date | null;
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
  indexedAt: Date | null;
}

export interface DocumentPage {
  page: number;
  text: string;
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
]);

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestion: IngestionService,
    private readonly config: AppConfig,
  ) {}

  async listForWorkspace(workspaceId: string): Promise<DocumentSummaryDto[]> {
    const docs = await this.prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { fullName: true } },
        _count: { select: { conversations: true } },
      },
    });
    return docs.map((d) => this.toSummary(d));
  }

  async getDetail(documentId: string): Promise<DocumentDetailDto> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: { select: { fullName: true } },
        _count: { select: { conversations: true } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found.');
    return {
      ...this.toSummary(doc),
      statusDetail: doc.statusDetail,
      summary: doc.summary,
      summaryEs: doc.summaryEs,
    };
  }

  async getStatus(documentId: string): Promise<DocumentStatusDto> {
    const doc = await this.prisma.document.findUniqueOrThrow({
      where: { id: documentId },
      select: {
        id: true,
        status: true,
        statusDetail: true,
        progressPages: true,
        pageCount: true,
        chunkCount: true,
        indexedAt: true,
      },
    });
    return doc;
  }

  /** Reconstruct page text from stored chunks for the document viewer. */
  async getContent(documentId: string): Promise<DocumentPage[]> {
    const chunks = await this.prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { idx: 'asc' },
      select: { page: true, content: true },
    });
    const byPage = new Map<number, string[]>();
    for (const c of chunks) {
      const list = byPage.get(c.page) ?? [];
      list.push(c.content);
      byPage.set(c.page, list);
    }
    return [...byPage.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([page, parts]) => ({ page, text: parts.join('\n\n') }));
  }

  async upload(
    workspaceId: string,
    uploadedById: string,
    file: Express.Multer.File,
  ): Promise<DocumentDetailDto> {
    if (!file) throw new BadRequestException('A file is required.');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file type. Upload a PDF, TXT, or Markdown file.',
      );
    }
    const maxBytes = this.config.maxUploadMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File exceeds the ${this.config.maxUploadMb} MB limit.`,
      );
    }

    const doc = await this.prisma.document.create({
      data: {
        workspaceId,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById,
        status: 'Queued',
      },
      include: {
        uploadedBy: { select: { fullName: true } },
        _count: { select: { conversations: true } },
      },
    });

    this.ingestion.enqueue(doc.id, file.buffer);

    return {
      ...this.toSummary(doc),
      statusDetail: doc.statusDetail,
      summary: doc.summary,
      summaryEs: doc.summaryEs,
    };
  }

  async reprocess(documentId: string): Promise<DocumentStatusDto> {
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'Queued', statusDetail: 'Queued for reprocessing' },
    });
    this.ingestion.enqueueReprocess(documentId);
    return this.getStatus(documentId);
  }

  async remove(documentId: string): Promise<void> {
    await this.prisma.document.delete({ where: { id: documentId } });
  }

  private toSummary(doc: {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    pageCount: number;
    status: DocumentStatus;
    progressPages: number;
    chunkCount: number;
    summary: string | null;
    createdAt: Date;
    indexedAt: Date | null;
    uploadedBy: { fullName: string };
    _count: { conversations: number };
  }): DocumentSummaryDto {
    return {
      id: doc.id,
      filename: doc.filename,
      fileKind: fileKindOf(doc.filename, doc.mimeType),
      sizeBytes: doc.sizeBytes,
      pageCount: doc.pageCount,
      status: doc.status,
      progressPages: doc.progressPages,
      chunkCount: doc.chunkCount,
      conversationCount: doc._count.conversations,
      hasSummary: !!doc.summary,
      uploadedByName: doc.uploadedBy.fullName,
      createdAt: doc.createdAt,
      indexedAt: doc.indexedAt,
    };
  }
}

export function fileKindOf(filename: string, mimeType: string): FileKind {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'word';
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return 'spreadsheet';
  if (ext === 'md' || ext === 'markdown' || mimeType.includes('markdown'))
    return 'markdown';
  return 'text';
}
