import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthService, parseDurationMs } from './auth.service';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';

interface FakeUser {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  failedLoginCount: number;
  lockoutUntil: Date | null;
}
interface FakeToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByHash: string | null;
}

/** Minimal in-memory Prisma fake covering the methods AuthService uses. */
class FakePrisma {
  users: FakeUser[] = [];
  tokens: FakeToken[] = [];

  user = {
    findUnique: ({ where }: { where: { email?: string; id?: string } }) =>
      Promise.resolve(
        this.users.find((u) =>
          where.email ? u.email === where.email : u.id === where.id,
        ) ?? null,
      ),
    findUniqueOrThrow: ({ where }: { where: { id: string } }) => {
      const u = this.users.find((x) => x.id === where.id);
      if (!u) throw new Error('not found');
      return Promise.resolve(u);
    },
    create: ({
      data,
    }: {
      data: { email: string; fullName: string; passwordHash: string };
    }) => {
      const u: FakeUser = {
        id: randomUUID(),
        failedLoginCount: 0,
        lockoutUntil: null,
        ...data,
      };
      this.users.push(u);
      return Promise.resolve(u);
    },
    update: ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<FakeUser>;
    }) => {
      const u = this.users.find((x) => x.id === where.id)!;
      Object.assign(u, data);
      return Promise.resolve(u);
    },
  };

  refreshToken = {
    create: ({
      data,
    }: {
      data: { userId: string; tokenHash: string; expiresAt: Date };
    }) => {
      const t: FakeToken = {
        id: randomUUID(),
        revokedAt: null,
        replacedByHash: null,
        ...data,
      };
      this.tokens.push(t);
      return Promise.resolve(t);
    },
    findUnique: ({
      where,
      include,
    }: {
      where: { tokenHash: string };
      include?: { user: boolean };
    }) => {
      const t = this.tokens.find((x) => x.tokenHash === where.tokenHash);
      if (!t) return Promise.resolve(null);
      if (include?.user) {
        const user = this.users.find((u) => u.id === t.userId);
        return Promise.resolve({ ...t, user });
      }
      return Promise.resolve(t);
    },
    update: ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<FakeToken>;
    }) => {
      const t = this.tokens.find((x) => x.id === where.id)!;
      Object.assign(t, data);
      return Promise.resolve(t);
    },
    updateMany: ({
      where,
      data,
    }: {
      where: { userId?: string; tokenHash?: string; revokedAt?: null };
      data: Partial<FakeToken>;
    }) => {
      const matched = this.tokens.filter(
        (t) =>
          (where.userId === undefined || t.userId === where.userId) &&
          (where.tokenHash === undefined || t.tokenHash === where.tokenHash) &&
          (where.revokedAt !== null || t.revokedAt === null),
      );
      matched.forEach((t) => Object.assign(t, data));
      return Promise.resolve({ count: matched.length });
    },
  };
}

const config = Object.assign(new AppConfig(), {
  jwtAccessSecret: 'test-access',
  jwtRefreshSecret: 'test-refresh',
  jwtAccessTtl: '15m',
  jwtRefreshTtl: '7d',
  anthropicApiKey: '',
  maxUploadMb: 15,
  port: 3000,
  corsOrigins: ['http://localhost:4200'],
});

describe('parseDurationMs', () => {
  it('parses units', () => {
    expect(parseDurationMs('900s')).toBe(900000);
    expect(parseDurationMs('15m')).toBe(900000);
    expect(parseDurationMs('1h')).toBe(3600000);
    expect(parseDurationMs('7d')).toBe(604800000);
  });
  it('throws on garbage', () => {
    expect(() => parseDurationMs('soon')).toThrow();
  });
});

describe('AuthService', () => {
  let prisma: FakePrisma;
  let auth: AuthService;

  beforeEach(() => {
    prisma = new FakePrisma();
    auth = new AuthService(
      prisma as unknown as PrismaService,
      new JwtService({}),
      config,
    );
  });

  const register = () =>
    auth.register({
      email: 'Jane@Example.com',
      fullName: 'Jane Doe',
      password: 'correct horse battery',
    });

  it('registers, lowercases email, and issues tokens', async () => {
    const result = await register();
    expect(result.user.email).toBe('jane@example.com');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.expiresIn).toBe(900);
  });

  it('rejects duplicate registration with 409', async () => {
    await register();
    await expect(register()).rejects.toBeInstanceOf(ConflictException);
  });

  it('uses the same message for unknown email and wrong password', async () => {
    await register();
    const unknown = await auth
      .login({ email: 'nobody@example.com', password: 'x' })
      .catch((e: Error) => e.message);
    const wrong = await auth
      .login({ email: 'jane@example.com', password: 'wrong' })
      .catch((e: Error) => e.message);
    expect(unknown).toBe(wrong);
    expect(unknown).toBe('Invalid email or password.');
  });

  it('locks the account after 5 failed attempts', async () => {
    await register();
    for (let i = 0; i < 5; i++) {
      await auth
        .login({ email: 'jane@example.com', password: 'wrong' })
        .catch(() => undefined);
    }
    const user = prisma.users[0];
    expect(user.failedLoginCount).toBe(5);
    expect(user.lockoutUntil).toBeInstanceOf(Date);

    // Even the correct password is refused while locked.
    await expect(
      auth.login({
        email: 'jane@example.com',
        password: 'correct horse battery',
      }),
    ).rejects.toThrow(/locked/i);
  });

  it('resets failure count on successful login', async () => {
    await register();
    await auth
      .login({ email: 'jane@example.com', password: 'wrong' })
      .catch(() => undefined);
    await auth.login({
      email: 'jane@example.com',
      password: 'correct horse battery',
    });
    expect(prisma.users[0].failedLoginCount).toBe(0);
  });

  it('rotates the refresh token and revokes the old one', async () => {
    const first = await register();
    const second = await auth.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);

    const oldToken = prisma.tokens[0];
    expect(oldToken.revokedAt).toBeInstanceOf(Date);
    expect(oldToken.replacedByHash).toBeTruthy();
  });

  it('detects refresh-token reuse and revokes the whole family', async () => {
    const first = await register();
    await auth.refresh(first.refreshToken); // rotates → old token now revoked

    await expect(auth.refresh(first.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    // every token for the user is now revoked
    expect(prisma.tokens.every((t) => t.revokedAt !== null)).toBe(true);
  });

  it('logout is idempotent', async () => {
    const first = await register();
    await expect(auth.logout(first.refreshToken)).resolves.toBeUndefined();
    await expect(auth.logout(first.refreshToken)).resolves.toBeUndefined();
    await expect(auth.logout('never-existed')).resolves.toBeUndefined();
  });
});
