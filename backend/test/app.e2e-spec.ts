import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /health reports status, db and llm mode', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    const body = res.body as { status: string; db: string; llm: string };
    expect(typeof body.status).toBe('string');
    expect(typeof body.db).toBe('string');
    expect(body.llm).toMatch(/^(claude|extractive)$/);
  });

  afterAll(async () => {
    await app.close();
  });
});
