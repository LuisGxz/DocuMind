import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentMembership } from '../workspaces/decorators/current-membership.decorator';
import { RequireRole } from '../workspaces/decorators/require-role.decorator';
import type { MembershipContext } from '../workspaces/guards/workspace-access.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { DocumentAccessGuard } from './guards/document-access.guard';
import {
  DocumentsService,
  type DocumentDetailDto,
  type DocumentPage,
  type DocumentStatusDto,
  type DocumentSummaryDto,
} from './documents.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get('workspaces/:slug/documents')
  @UseGuards(WorkspaceAccessGuard)
  list(
    @CurrentMembership() membership: MembershipContext,
  ): Promise<DocumentSummaryDto[]> {
    return this.documents.listForWorkspace(membership.workspaceId);
  }

  @Post('workspaces/:slug/documents')
  @RequireRole(Role.Owner)
  @UseGuards(WorkspaceAccessGuard)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentDetailDto> {
    return this.documents.upload(membership.workspaceId, user.id, file);
  }

  @Get('documents/:id')
  @UseGuards(DocumentAccessGuard)
  detail(@Param('id') id: string): Promise<DocumentDetailDto> {
    return this.documents.getDetail(id);
  }

  @Get('documents/:id/status')
  @UseGuards(DocumentAccessGuard)
  status(@Param('id') id: string): Promise<DocumentStatusDto> {
    return this.documents.getStatus(id);
  }

  @Get('documents/:id/content')
  @UseGuards(DocumentAccessGuard)
  content(@Param('id') id: string): Promise<DocumentPage[]> {
    return this.documents.getContent(id);
  }

  @Post('documents/:id/reprocess')
  @RequireRole(Role.Owner)
  @UseGuards(DocumentAccessGuard)
  reprocess(@Param('id') id: string): Promise<DocumentStatusDto> {
    return this.documents.reprocess(id);
  }

  @Delete('documents/:id')
  @RequireRole(Role.Owner)
  @UseGuards(DocumentAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.documents.remove(id);
  }
}
