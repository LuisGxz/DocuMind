import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { WorkspaceAccessGuard } from './workspace-access.guard';
import { PrismaService } from '../../prisma/prisma.service';

function makeContext(req: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makePrisma(opts: {
  workspaceId?: string | null;
  role?: Role | null;
}): PrismaService {
  return {
    workspace: {
      findUnique: () =>
        Promise.resolve(opts.workspaceId ? { id: opts.workspaceId } : null),
    },
    membership: {
      findUnique: () =>
        Promise.resolve(opts.role ? { id: 'm1', role: opts.role } : null),
    },
  } as unknown as PrismaService;
}

function makeReflector(roles: Role[] | undefined): Reflector {
  return {
    getAllAndOverride: () => roles,
  } as unknown as Reflector;
}

const user = { id: 'u1', email: 'a@b.c', fullName: 'A' };

describe('WorkspaceAccessGuard', () => {
  it('rejects an unauthenticated request', async () => {
    const guard = new WorkspaceAccessGuard(
      makePrisma({ workspaceId: 'ws1', role: Role.Owner }),
      makeReflector(undefined),
    );
    await expect(
      guard.canActivate(makeContext({ params: { slug: 'legal' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('404s when the workspace slug does not exist', async () => {
    const guard = new WorkspaceAccessGuard(
      makePrisma({ workspaceId: null }),
      makeReflector(undefined),
    );
    await expect(
      guard.canActivate(makeContext({ user, params: { slug: 'nope' } })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('forbids a non-member', async () => {
    const guard = new WorkspaceAccessGuard(
      makePrisma({ workspaceId: 'ws1', role: null }),
      makeReflector(undefined),
    );
    await expect(
      guard.canActivate(makeContext({ user, params: { slug: 'legal' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows any member when no role is required and attaches membership', async () => {
    const guard = new WorkspaceAccessGuard(
      makePrisma({ workspaceId: 'ws1', role: Role.Viewer }),
      makeReflector(undefined),
    );
    const req: Record<string, unknown> = { user, params: { slug: 'legal' } };
    await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);
    expect(req.membership).toMatchObject({
      workspaceId: 'ws1',
      role: Role.Viewer,
    });
  });

  it('forbids a Viewer from an Owner-only route', async () => {
    const guard = new WorkspaceAccessGuard(
      makePrisma({ workspaceId: 'ws1', role: Role.Viewer }),
      makeReflector([Role.Owner]),
    );
    await expect(
      guard.canActivate(makeContext({ user, params: { slug: 'legal' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an Owner on an Owner-only route', async () => {
    const guard = new WorkspaceAccessGuard(
      makePrisma({ workspaceId: 'ws1', role: Role.Owner }),
      makeReflector([Role.Owner]),
    );
    await expect(
      guard.canActivate(makeContext({ user, params: { slug: 'legal' } })),
    ).resolves.toBe(true);
  });
});
