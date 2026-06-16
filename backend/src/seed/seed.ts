import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as argon2 from 'argon2';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { SEED_CORPUS } from './corpus';

const WORKSPACE = {
  slug: 'legal-contracts',
  name: 'Legal & Contracts',
  nameEs: 'Legal y Contratos',
  description: 'Vendor agreements, NDAs, and policy documents.',
  descriptionEs: 'Acuerdos con proveedores, NDAs y documentos de política.',
};

const DEMO_USERS = [
  {
    email: 'owner@documind.dev',
    fullName: 'Olivia Owner',
    password: 'Owner1234!',
    role: 'Owner' as const,
  },
  {
    email: 'viewer@documind.dev',
    fullName: 'Victor Viewer',
    password: 'Viewer1234!',
    role: 'Viewer' as const,
  },
];

async function main(): Promise<void> {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const prisma = app.get(PrismaService);
  const ingestion = app.get(IngestionService);

  const workspace = await prisma.workspace.upsert({
    where: { slug: WORKSPACE.slug },
    update: {
      name: WORKSPACE.name,
      nameEs: WORKSPACE.nameEs,
      description: WORKSPACE.description,
      descriptionEs: WORKSPACE.descriptionEs,
    },
    create: WORKSPACE,
  });

  let ownerId = '';
  for (const u of DEMO_USERS) {
    const passwordHash = await argon2.hash(u.password);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, passwordHash },
      create: { email: u.email, fullName: u.fullName, passwordHash },
    });
    if (u.role === 'Owner') ownerId = user.id;
    await prisma.membership.upsert({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId: user.id },
      },
      update: { role: u.role },
      create: { workspaceId: workspace.id, userId: user.id, role: u.role },
    });
    logger.log(`User ${u.email} (${u.role}) ready`);
  }

  for (const doc of SEED_CORPUS) {
    const existing = await prisma.document.findFirst({
      where: { workspaceId: workspace.id, filename: doc.filename },
    });
    if (existing && existing.status === 'Indexed' && existing.chunkCount > 0) {
      logger.log(`Skipping ${doc.filename} (already indexed)`);
      continue;
    }

    const body = doc.pages.join('\f');
    const buffer = Buffer.from(body, 'utf-8');

    const record =
      existing ??
      (await prisma.document.create({
        data: {
          workspaceId: workspace.id,
          filename: doc.filename,
          mimeType: doc.mimeType,
          sizeBytes: buffer.byteLength,
          uploadedById: ownerId,
          status: 'Queued',
        },
      }));

    logger.log(`Ingesting ${doc.filename}…`);
    await ingestion.ingest(record.id, buffer);
  }

  const totals = await prisma.document.aggregate({
    where: { workspaceId: workspace.id },
    _sum: { pageCount: true, chunkCount: true },
    _count: true,
  });
  logger.log(
    `Seed complete: ${totals._count} documents, ${totals._sum.pageCount ?? 0} pages, ${totals._sum.chunkCount ?? 0} chunks indexed.`,
  );

  await app.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
