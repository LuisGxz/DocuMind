import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    EmbeddingsModule,
    IngestionModule,
    HealthModule,
  ],
})
export class AppModule {}
