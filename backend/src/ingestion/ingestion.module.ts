import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { GenerationModule } from '../generation/generation.module';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [EmbeddingsModule, GenerationModule],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
