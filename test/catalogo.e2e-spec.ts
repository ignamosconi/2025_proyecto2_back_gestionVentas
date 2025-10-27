import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * E2E Tests para Proceso Central: GESTIÓN DE CATÁLOGO
 *
 * Flujos críticos:
 * 1. CRUD de Marcas
 * 2. CRUD de Líneas
 * 3. Asociación Marca-Línea (Many-to-Many)
 * 4. Validaciones de negocio (nombres únicos, soft delete, restore)
 */
describe('Catálogo Flow (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerToken: string;
  let marcaId: number;
  let lineaId: number;

  // Credenciales del OWNER (debe existir por seed)
  const ownerCredentials = {
    email: process.env.SEED_OWNER_EMAIL || 'owner@test.com',
    password: process.env.SEED_OWNER_PASSWORD || 'Owner123!',
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

    // Autenticar como OWNER
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(ownerCredentials);

    ownerToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (dataSource && marcaId) {
      await dataSource.query(`DELETE FROM marca WHERE id = ${marcaId}`);
    }
    if (dataSource && lineaId) {
      await dataSource.query(`DELETE FROM linea WHERE id = ${lineaId}`);
    }
    await app.close();
  });

  describe('1. Gestión de Marcas', () => {
    const marcaData = {
      nombre: `Marca-Test-${Date.now()}`,
      descripcion: 'Marca de prueba E2E',
    };

    it('debería crear una nueva marca (OWNER)', () => {
      return request(app.getHttpServer())
        .post('/api/catalogo/marcas')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(marcaData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.nombre).toBe(marcaData.nombre);
          marcaId = res.body.id;
        });
    });

    it('debería rechazar marca con nombre duplicado', () => {
      return request(app.getHttpServer())
        .post('/api/catalogo/marcas')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(marcaData)
        .expect(400);
    });

    it('debería obtener marca por ID', () => {
      return request(app.getHttpServer())
        .get(`/api/catalogo/marcas/${marcaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(marcaId);
          expect(res.body.nombre).toBe(marcaData.nombre);
        });
    });

    it('debería actualizar marca existente', () => {
      const updateData = { descripcion: 'Descripción actualizada' };

      return request(app.getHttpServer())
        .patch(`/api/catalogo/marcas/${marcaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.descripcion).toBe(updateData.descripcion);
        });
    });

    it('debería listar todas las marcas activas', () => {
      return request(app.getHttpServer())
        .get('/api/catalogo/marcas')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('2. Gestión de Líneas', () => {
    const lineaData = {
      nombre: `Linea-Test-${Date.now()}`,
      descripcion: 'Línea de prueba E2E',
    };

    it('debería crear una nueva línea (OWNER)', () => {
      return request(app.getHttpServer())
        .post('/api/catalogo/lineas')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(lineaData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.nombre).toBe(lineaData.nombre);
          lineaId = res.body.id;
        });
    });

    it('debería obtener línea por ID', () => {
      return request(app.getHttpServer())
        .get(`/api/catalogo/lineas/${lineaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(lineaId);
        });
    });

    it('debería listar todas las líneas activas', () => {
      return request(app.getHttpServer())
        .get('/api/catalogo/lineas')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('3. Asociación Marca-Línea (Many-to-Many)', () => {
    it('debería asociar línea a marca', () => {
      return request(app.getHttpServer())
        .post('/api/catalogo/marca-linea/assign')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          marcaId: marcaId,
          lineaId: lineaId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.marcaId).toBe(marcaId);
          expect(res.body.lineaId).toBe(lineaId);
        });
    });

    it('debería rechazar asociación duplicada', () => {
      return request(app.getHttpServer())
        .post('/api/catalogo/marca-linea/assign')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          marcaId: marcaId,
          lineaId: lineaId,
        })
        .expect(409);
    });

    it('debería listar líneas de una marca', () => {
      return request(app.getHttpServer())
        .get(`/api/catalogo/marca-linea/marca/${marcaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].lineaId).toBe(lineaId);
        });
    });

    it('debería desasociar línea de marca (soft delete)', () => {
      return request(app.getHttpServer())
        .delete(`/api/catalogo/marca-linea/${marcaId}/${lineaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });
  });

  describe('4. Soft Delete y Restore', () => {
    it('debería eliminar marca (soft delete)', () => {
      return request(app.getHttpServer())
        .delete(`/api/catalogo/marcas/${marcaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('debería restaurar marca eliminada', () => {
      return request(app.getHttpServer())
        .patch(`/api/catalogo/marcas/${marcaId}/restore`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('debería eliminar línea (soft delete)', () => {
      return request(app.getHttpServer())
        .delete(`/api/catalogo/lineas/${lineaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('debería restaurar línea eliminada', () => {
      return request(app.getHttpServer())
        .patch(`/api/catalogo/lineas/${lineaId}/restore`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });
  });
});
