import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthResult, AuthUser, JwtPayload } from './auth.types';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;
const INVALID_CREDENTIALS = 'Invalid email or password.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email, fullName: dto.fullName.trim(), passwordHash },
    });
    return this.issueResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Same response for unknown email and wrong password (no user enumeration).
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account temporarily locked due to failed attempts. Try again in ${minutes} minute(s).`,
      );
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.registerFailedAttempt(user.id, user.failedLoginCount);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.failedLoginCount > 0 || user.lockoutUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockoutUntil: null },
      });
    }
    return this.issueResult(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Reuse of an already-rotated token → treat the whole family as compromised.
    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token has been revoked.');
    }

    if (stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    const next = await this.issueResult(stored.user);
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        revokedAt: new Date(),
        replacedByHash: this.hashToken(next.refreshToken),
      },
    });
    return next;
  }

  /** Idempotent: revoking an unknown or already-revoked token is a no-op. */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return { id: user.id, email: user.email, fullName: user.fullName };
  }

  private async registerFailedAttempt(
    userId: string,
    currentCount: number,
  ): Promise<void> {
    const count = currentCount + 1;
    const data: { failedLoginCount: number; lockoutUntil?: Date } = {
      failedLoginCount: count,
    };
    if (count >= LOCKOUT_THRESHOLD) {
      data.lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
    }
    await this.prisma.user.update({ where: { id: userId }, data });
  }

  private async issueResult(user: {
    id: string;
    email: string;
    fullName: string;
  }): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.fullName,
    };
    const accessTtlSeconds = Math.floor(
      parseDurationMs(this.config.jwtAccessTtl) / 1000,
    );
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.jwtAccessSecret,
      expiresIn: accessTtlSeconds,
    });

    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + parseDurationMs(this.config.jwtRefreshTtl),
    );
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtlSeconds,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

/** Parse durations like "15m", "7d", "900s", "12h" into milliseconds. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) return asNumber * 1000;
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit]!;
  return amount * factor;
}
