import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { AuthUser } from '../../auth/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_ROLE_KEY } from '../decorators/require-role.decorator';

export interface MembershipContext {
  workspaceId: string;
  membershipId: string;
  role: Role;
}

type GuardedRequest = Request & {
  user?: AuthUser;
  membership?: MembershipContext;
};

/**
 * Resolves the caller's workspace membership (from a `:slug` route param, or a
 * `workspaceId` in params/body/query) and enforces any `@RequireRole(...)`.
 * Attaches `req.membership` for downstream handlers. Must run after JwtAuthGuard.
 */
@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<GuardedRequest>();
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const workspaceId = await this.resolveWorkspaceId(req);
    if (!workspaceId) throw new NotFoundException('Workspace not found.');

    const membership = await this.prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace.');
    }

    const required = this.reflector.getAllAndOverride<Role[]>(
      REQUIRE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (required?.length && !required.includes(membership.role)) {
      throw new ForbiddenException(
        `This action requires the ${required.join(' or ')} role.`,
      );
    }

    req.membership = {
      workspaceId,
      membershipId: membership.id,
      role: membership.role,
    };
    return true;
  }

  private async resolveWorkspaceId(
    req: GuardedRequest,
  ): Promise<string | null> {
    const params = req.params as Record<string, string | undefined>;
    if (params.slug) {
      const ws = await this.prisma.workspace.findUnique({
        where: { slug: params.slug },
        select: { id: true },
      });
      return ws?.id ?? null;
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const query = req.query as Record<string, unknown>;
    const candidate =
      params.workspaceId ?? body.workspaceId ?? query.workspaceId;
    return typeof candidate === 'string' ? candidate : null;
  }
}
