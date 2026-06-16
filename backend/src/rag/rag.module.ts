import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { DocumentsModule } from '../documents/documents.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { GenerationModule } from '../generation/generation.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { RetrievalService } from './retrieval.service';

@Module({
  imports: [
    DocumentsModule,
    EmbeddingsModule,
    GenerationModule,
    ConversationsModule,
  ],
  controllers: [RagController],
  providers: [RagService, RetrievalService],
  exports: [RetrievalService],
})
export class RagModule {}
