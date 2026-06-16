import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { DocumentAccessGuard } from './document-access.guard';
import { PrismaService } from '../../prisma/prisma.service';

function makeContext(req: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makePrisma(opts: {
  document?: { id: string; workspaceId: string } | null;
  role?: Role | null;
}): PrismaService {
  return {
    document: {
      findUnique: () => Promise.resolve(opts.document ?? null),
    },
    membership: {
      findUnique: () =>
        Promise.resolve(opts.role ? { id: 'm1', role: opts.role } : null),
    },
  } as unknown as PrismaService;
}

const reflector = (roles?: Role[]): Reflector =>
  ({ getAllAndOverride: () => roles }) as unknown as Reflector;

const user = { id: 'u1', email: 'a@b.c', fullName: 'A' };
const doc = { id: 'd1', workspaceId: 'ws1' };

describe('DocumentAccessGuard', () => {
  it('401 without a user', async () => {
    const guard = new DocumentAccessGuard(
      makePrisma({ document: doc, role: Role.Owner }),
      reflector(),
    );
    await expect(
      guard.canActivate(makeContext({ params: { id: 'd1' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('404 when the document does not exist', async () => {
    const guard = new DocumentAccessGuard(
      makePrisma({ document: null }),
      reflector(),
    );
    await expect(
      guard.canActivate(makeContext({ user, params: { id: 'nope' } })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('403 for a non-member', async () => {
    const guard = new DocumentAccessGuard(
      makePrisma({ document: doc, role: null }),
      reflector(),
    );
    await expect(
      guard.canActivate(makeContext({ user, params: { id: 'd1' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('attaches document + membership for a member with no role requirement', async () => {
    const guard = new DocumentAccessGuard(
      makePrisma({ document: doc, role: Role.Viewer }),
      reflector(),
    );
    const req: Record<string, unknown> = { user, params: { id: 'd1' } };
    await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);
    expect(req.document).toEqual(doc);
    expect(req.membership).toMatchObject({
      workspaceId: 'ws1',
      role: 'Viewer',
    });
  });

  it('403 for a Viewer on an Owner-only route', async () => {
    const guard = new DocumentAccessGuard(
      makePrisma({ document: doc, role: Role.Viewer }),
      reflector([Role.Owner]),
    );
    await expect(
      guard.canActivate(makeContext({ user, params: { id: 'd1' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an Owner on an Owner-only route', async () => {
    const guard = new DocumentAccessGuard(
      makePrisma({ document: doc, role: Role.Owner }),
      reflector([Role.Owner]),
    );
    await expect(
      guard.canActivate(makeContext({ user, params: { id: 'd1' } })),
    ).resolves.toBe(true);
  });
});
