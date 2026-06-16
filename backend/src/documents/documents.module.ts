import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentAccessGuard } from './guards/document-access.guard';

@Module({
  imports: [IngestionModule, WorkspacesModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentAccessGuard],
  exports: [DocumentsService, DocumentAccessGuard],
})
export class DocumentsModule {}
