import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentAccessGuard } from '../documents/guards/document-access.guard';
import {
  ConversationsService,
  type ConversationDetailDto,
  type ConversationSummaryDto,
} from './conversations.service';
import {
  CreateConversationDto,
  RenameConversationDto,
} from './dto/conversation.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get('documents/:id/conversations')
  @UseGuards(DocumentAccessGuard)
  list(
    @Param('id') documentId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ConversationSummaryDto[]> {
    return this.conversations.listForDocument(documentId, user.id);
  }

  @Post('documents/:id/conversations')
  @UseGuards(DocumentAccessGuard)
  create(
    @Param('id') documentId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationSummaryDto> {
    return this.conversations.create(
      documentId,
      user.id,
      dto.title ?? 'New conversation',
    );
  }

  @Get('conversations/:id')
  detail(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ConversationDetailDto> {
    return this.conversations.getDetail(id, user.id);
  }

  @Patch('conversations/:id')
  rename(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: RenameConversationDto,
  ): Promise<ConversationSummaryDto> {
    return this.conversations.rename(id, user.id, dto.title);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.conversations.remove(id, user.id);
  }
}
