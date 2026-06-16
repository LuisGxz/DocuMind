import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentAccessGuard } from '../documents/guards/document-access.guard';
import { ChatDto } from './dto/chat.dto';
import { RagService } from './rag.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(private readonly rag: RagService) {}

  /**
   * RAG chat over a document, streamed as Server-Sent Events so the frontend
   * renders the answer token-by-token. Any member (Owner or Viewer) may ask.
   * Errors raised before the first byte are still handled by the global filter
   * (the guard runs first); once streaming starts we emit an `error` event.
   */
  @Post('documents/:id/chat')
  @UseGuards(DocumentAccessGuard)
  async chat(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ChatDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      for await (const event of this.rag.chat(
        id,
        user.id,
        dto.conversationId ?? null,
        dto.question,
      )) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (err) {
      const message =
        err instanceof HttpException
          ? err.message
          : 'Something went wrong while generating the answer.';
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Get('documents/:id/suggested-questions')
  @UseGuards(DocumentAccessGuard)
  async suggested(@Param('id') id: string): Promise<{ questions: string[] }> {
    return { questions: await this.rag.suggestQuestions(id) };
  }
}
