import { Logger, Module } from '@nestjs/common';
import { AppConfig } from '../config/app-config';
import { ANSWER_GENERATOR, AnswerGenerator } from './answer-generator';
import { ClaudeAnswerGenerator } from './claude-answer.generator';
import { ExtractiveAnswerGenerator } from './extractive-answer.generator';

/**
 * Binds ANSWER_GENERATOR to the right implementation at boot: Claude when a key
 * is configured, the deterministic extractive generator otherwise. Kept in its
 * own module (depending on nothing app-specific) so both the ingestion pipeline
 * (summaries) and the RAG chat can consume it without a circular import.
 */
@Module({
  providers: [
    {
      provide: ANSWER_GENERATOR,
      inject: [AppConfig],
      useFactory: (config: AppConfig): AnswerGenerator => {
        const logger = new Logger('GenerationModule');
        if (config.claudeEnabled) {
          logger.log(`Answer generator: Claude (${config.anthropicModel})`);
          return new ClaudeAnswerGenerator(
            config.anthropicApiKey,
            config.anthropicModel,
          );
        }
        logger.log('Answer generator: extractive (deterministic, no API key)');
        return new ExtractiveAnswerGenerator();
      },
    },
  ],
  exports: [ANSWER_GENERATOR],
})
export class GenerationModule {}
