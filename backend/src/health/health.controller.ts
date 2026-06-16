import { Controller, Get } from '@nestjs/common';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  @Get()
  async check(): Promise<{
    status: string;
    db: string;
    llm: 'claude' | 'extractive';
    time: string;
  }> {
    let db = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      db,
      llm: this.config.claudeEnabled ? 'claude' : 'extractive',
      time: new Date().toISOString(),
    };
  }
}
