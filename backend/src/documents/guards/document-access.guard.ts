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
import { REQUIRE_ROLE_KEY } from '../../workspaces/decorators/require-role.decorator';
import { MembershipContext } from '../../workspaces/guards/workspace-access.guard';

export interface DocumentContext {
  id: string;
  workspaceId: string;
}

type GuardedRequest = Request & {
  user?: AuthUser;
  membership?: MembershipContext;
  document?: DocumentContext;
};

/**
 * Resolves the workspace from a `:id` document route, enforces the caller's
 * membership and any `@RequireRole(...)`, and attaches `req.document` +
 * `req.membership`. Must run after JwtAuthGuard.
 */
@Injectable()
export class DocumentAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<GuardedRequest>();
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const documentId = (req.params as Record<string, string>).id;
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, workspaceId: true },
    });
    if (!document) throw new NotFoundException('Document not found.');

    const membership = await this.prisma.membership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: document.workspaceId,
          userId: user.id,
        },
      },
    });
    if (!membership) {
      throw new ForbiddenException('You do not have access to this document.');
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

    req.document = document;
    req.membership = {
      workspaceId: document.workspaceId,
      membershipId: membership.id,
      role: membership.role,
    };
    return true;
  }
}
