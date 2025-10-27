import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * E2E Tests para Proceso Central: AUTENTICACIÓN
 *
 * Flujos críticos:
 * 1. Registro de usuario EMPLOYEE
 * 2. Login con credenciales válidas
 * 3. Refresh de tokens
 * 4. Protección de rutas con AuthGuard
 */
describe('Auth Flow (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let refreshToken: string;

  // Usuario de prueba
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+54 9 11 1234-5678',
    address: 'Test Address 123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    // Limpiar usuario de prueba
    if (dataSource) {
      await dataSource.query(`DELETE FROM users WHERE email = '${testUser.email}'`);
    }
    await app.close();
  });

  describe('1. Registro de Usuario (POST /api/auth/register)', () => {
    it('debería registrar un nuevo usuario EMPLOYEE exitosamente', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.role).toBe('EMPLOYEE');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('debería rechazar registro con email duplicado', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);
    });

    it('debería rechazar registro con contraseña débil', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'another@test.com',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('2. Login (POST /api/auth/login)', () => {
    it('debería autenticar usuario y devolver tokens', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(typeof res.body.accessToken).toBe('string');
          expect(typeof res.body.refreshToken).toBe('string');

          // Guardar tokens para tests posteriores
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('debería rechazar login con email incorrecto', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: testUser.password,
        })
        .expect(401);
    });

    it('debería rechazar login con contraseña incorrecta', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });

  describe('3. Refresh Token (POST /api/auth/refresh)', () => {
    it('debería generar nuevos tokens con refresh token válido', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.accessToken).not.toBe(accessToken);
        });
    });

    it('debería rechazar refresh con token inválido', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token-xyz')
        .expect(401);
    });
  });

  describe('4. Protección de Rutas (AuthGuard)', () => {
    it('debería permitir acceso a ruta protegida con token válido', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('debería rechazar acceso sin token', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .expect(401);
    });

    it('debería rechazar acceso con token inválido', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'Bearer token-invalido-123')
        .expect(401);
    });
  });
});
