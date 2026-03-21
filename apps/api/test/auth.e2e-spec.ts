import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionModule } from '@common/exception/infrastructure';
import { GlobalExceptionFilter } from '@common/exception/infrastructure';
import { ResponseInterceptor } from '@common/helpers/infrastructure';
import { RequestIdMiddleware } from '@common/helpers/infrastructure';
import { UserEntity } from '@modules/users/infrastructure/persistence/user.entity';
import { AuthModule } from '@modules/auth/infrastructure';
import { AppModule } from '../src/app.module';

/**
 * E2E tests for Auth endpoints (Story 1-1)
 *
 * These tests require a running PostgreSQL instance.
 * Set environment variables before running:
 *   DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME
 *   JWT_SECRET, JWT_REFRESH_SECRET
 *
 * Run: pnpm --filter api test:e2e
 */
describe('Auth E2E (Story 1-1)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/health', () => {
    it('should return 200 with database status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.database).toBeDefined();
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return setup_completed status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/status')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data.setup_completed).toBe('boolean');
    });
  });

  describe('POST /api/auth/setup', () => {
    it('should create admin and return tokens with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({
          name: 'Admin User',
          email: 'admin@markdown.test',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
      expect(typeof response.body.data.access_token).toBe('string');
      expect(typeof response.body.data.refresh_token).toBe('string');
    });

    it('should return AUT003 error when setup already completed', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({
          name: 'Another Admin',
          email: 'another@markdown.test',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.code_error).toBe('AUT003');
      expect(response.body.message).toBe('Setup already completed.');
    });

    it('should return 400 for invalid data (missing name)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({
          email: 'test@markdown.test',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({
          name: 'Test',
          email: 'test@markdown.test',
          password: '1234',
        })
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({
          name: 'Test',
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/auth/status (after setup)', () => {
    it('should return setup_completed: true after admin was created', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/status')
        .expect(200);

      expect(response.body.data.setup_completed).toBe(true);
    });
  });
});
