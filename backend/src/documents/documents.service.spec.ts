import { BadRequestException } from '@nestjs/common';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { DocumentsService, fileKindOf } from './documents.service';

describe('fileKindOf', () => {
  it('maps extensions and mime types to a file kind', () => {
    expect(fileKindOf('msa.pdf', 'application/pdf')).toBe('pdf');
    expect(fileKindOf('notes.PDF', 'application/octet-stream')).toBe('pdf');
    expect(fileKindOf('offer.docx', 'text/plain')).toBe('word');
    expect(fileKindOf('pricing.xlsx', 'text/plain')).toBe('spreadsheet');
    expect(fileKindOf('readme.md', 'text/plain')).toBe('markdown');
    expect(fileKindOf('plain.txt', 'text/plain')).toBe('text');
    expect(fileKindOf('noext', 'text/markdown')).toBe('markdown');
  });
});

describe('DocumentsService.upload validation', () => {
  const config = Object.assign(new AppConfig(), { maxUploadMb: 1 });
  const ingestion = {
    enqueue: jest.fn(),
  } as unknown as IngestionService;
  const prisma = {} as PrismaService;
  const service = new DocumentsService(prisma, ingestion, config);

  const file = (over: Partial<Express.Multer.File>): Express.Multer.File =>
    ({
      originalname: 'x.txt',
      mimetype: 'text/plain',
      size: 10,
      buffer: Buffer.from('hi'),
      ...over,
    }) as Express.Multer.File;

  it('rejects a missing file', async () => {
    await expect(
      service.upload('ws', 'u', undefined as unknown as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unsupported mime type', async () => {
    await expect(
      service.upload('ws', 'u', file({ mimetype: 'image/png' })),
    ).rejects.toThrow(/Unsupported file type/);
  });

  it('rejects a file over the size limit', async () => {
    await expect(
      service.upload('ws', 'u', file({ size: 2 * 1024 * 1024 })),
    ).rejects.toThrow(/exceeds/);
  });
});
