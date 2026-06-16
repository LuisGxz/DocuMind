import { plainToInstance } from 'class-transformer';
import { IsInt, IsString, Min, validateSync } from 'class-validator';

/**
 * Typed, validated application configuration. Fails fast at boot if a required
 * variable is missing or malformed (no silent `undefined` deep in a service).
 */
export class AppConfig {
  @IsString()
  databaseUrl!: string;

  @IsString()
  jwtAccessSecret!: string;

  @IsString()
  jwtRefreshSecret!: string;

  @IsString()
  jwtAccessTtl!: string;

  @IsString()
  jwtRefreshTtl!: string;

  /** Empty string = run the deterministic extractive generator (no Claude key). */
  @IsString()
  anthropicApiKey!: string;

  @IsInt()
  @Min(1)
  maxUploadMb!: number;

  @IsInt()
  @Min(1)
  port!: number;

  @IsString({ each: true })
  corsOrigins!: string[];

  /** True when a Claude key is present → real LLM generation; otherwise extractive. */
  get claudeEnabled(): boolean {
    return this.anthropicApiKey.trim().length > 0;
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const config = plainToInstance(AppConfig, {
    databaseUrl: env.DATABASE_URL,
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtAccessTtl: env.JWT_ACCESS_TTL ?? '15m',
    jwtRefreshTtl: env.JWT_REFRESH_TTL ?? '7d',
    anthropicApiKey: env.ANTHROPIC_API_KEY ?? '',
    maxUploadMb: Number(env.MAX_UPLOAD_MB ?? '15'),
    port: Number(env.PORT ?? '3000'),
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:4200')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  });

  const errors = validateSync(config, { whitelist: true });
  if (errors.length > 0) {
    const detail = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${detail}`);
  }
  return config;
}

export const APP_CONFIG = Symbol('APP_CONFIG');
