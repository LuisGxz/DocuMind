import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentMembership } from './decorators/current-membership.decorator';
import {
  WorkspaceAccessGuard,
  type MembershipContext,
} from './guards/workspace-access.guard';
import { WorkspacesService, type WorkspaceSummary } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<WorkspaceSummary[]> {
    return this.workspaces.listForUser(user.id);
  }

  @Get(':slug')
  @UseGuards(WorkspaceAccessGuard)
  detail(
    @Param('slug') slug: string,
    @CurrentMembership() membership: MembershipContext,
  ): Promise<WorkspaceSummary> {
    return this.workspaces.getBySlugForUser(slug, membership.role);
  }
}
