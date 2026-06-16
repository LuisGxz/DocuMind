import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [EmbeddingsModule],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
