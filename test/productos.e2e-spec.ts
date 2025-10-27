import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * E2E Tests para Proceso Central: GESTIÓN DE PRODUCTOS
 *
 * Flujos críticos:
 * 1. CRUD de Productos
 * 2. Gestión de Stock (incrementar/decrementar)
 * 3. Alerta de stock bajo
 * 4. Validación de marca y línea existentes
 */
describe('Productos Flow (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerToken: string;
  let productoId: number;
  let marcaId: number;
  let lineaId: number;

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

    // Crear marca y línea para tests
    const marcaRes = await request(app.getHttpServer())
      .post('/api/catalogo/marcas')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        nombre: `Marca-Producto-${Date.now()}`,
        descripcion: 'Marca para test de producto',
      });
    marcaId = marcaRes.body.id;

    const lineaRes = await request(app.getHttpServer())
      .post('/api/catalogo/lineas')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        nombre: `Linea-Producto-${Date.now()}`,
        descripcion: 'Línea para test de producto',
      });
    lineaId = lineaRes.body.id;

    // Asociar marca-línea
    await request(app.getHttpServer())
      .post('/api/catalogo/marca-linea/assign')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ marcaId, lineaId });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (dataSource && productoId) {
      await dataSource.query(`DELETE FROM producto WHERE "idProducto" = ${productoId}`);
    }
    if (dataSource && marcaId) {
      await dataSource.query(`DELETE FROM marca_linea WHERE "marcaId" = ${marcaId}`);
      await dataSource.query(`DELETE FROM marca WHERE id = ${marcaId}`);
    }
    if (dataSource && lineaId) {
      await dataSource.query(`DELETE FROM linea WHERE id = ${lineaId}`);
    }
    await app.close();
  });

  describe('1. Creación de Productos', () => {
    const productoData = {
      nombre: `Producto-Test-${Date.now()}`,
      descripcion: 'Producto de prueba E2E',
      precio: 1500.50,
      stock: 100,
      alertaStock: 10,
      idMarca: 0, // Se asignará en el test
      idLinea: 0,
    };

    it('debería crear producto con marca y línea válidas', () => {
      productoData.idMarca = marcaId;
      productoData.idLinea = lineaId;

      return request(app.getHttpServer())
        .post('/api/productos')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(productoData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('idProducto');
          expect(res.body.nombre).toBe(productoData.nombre);
          expect(res.body.precio).toBe(productoData.precio);
          expect(res.body.stock).toBe(productoData.stock);
          productoId = res.body.idProducto;
        });
    });

    it('debería rechazar producto con marca inexistente', () => {
      return request(app.getHttpServer())
        .post('/api/productos')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...productoData,
          idMarca: 99999,
          nombre: `Producto-Invalid-${Date.now()}`,
        })
        .expect(404);
    });

    it('debería rechazar producto con línea inexistente', () => {
      return request(app.getHttpServer())
        .post('/api/productos')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...productoData,
          idLinea: 99999,
          nombre: `Producto-Invalid2-${Date.now()}`,
        })
        .expect(404);
    });

    it('debería rechazar producto con precio negativo', () => {
      return request(app.getHttpServer())
        .post('/api/productos')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...productoData,
          precio: -100,
          nombre: `Producto-Invalid3-${Date.now()}`,
        })
        .expect(400);
    });
  });

  describe('2. Consulta de Productos', () => {
    it('debería obtener producto por ID', () => {
      return request(app.getHttpServer())
        .get(`/api/productos/${productoId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.idProducto).toBe(productoId);
          expect(res.body).toHaveProperty('marca');
          expect(res.body).toHaveProperty('linea');
        });
    });

    it('debería listar todos los productos activos', () => {
      return request(app.getHttpServer())
        .get('/api/productos')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('debería rechazar consulta de producto inexistente', () => {
      return request(app.getHttpServer())
        .get('/api/productos/99999')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });
  });

  describe('3. Actualización de Productos', () => {
    it('debería actualizar información del producto', () => {
      const updateData = {
        nombre: `Producto-Actualizado-${Date.now()}`,
        precio: 2000.00,
      };

      return request(app.getHttpServer())
        .patch(`/api/productos/${productoId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.nombre).toBe(updateData.nombre);
          expect(res.body.precio).toBe(updateData.precio);
        });
    });
  });

  describe('4. Gestión de Stock', () => {
    it('debería incrementar stock del producto', () => {
      return request(app.getHttpServer())
        .patch(`/api/productos/${productoId}/stock`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ change: 50 })
        .expect(200)
        .expect((res) => {
          expect(res.body.stock).toBe(150); // 100 inicial + 50
        });
    });

    it('debería decrementar stock del producto', () => {
      return request(app.getHttpServer())
        .patch(`/api/productos/${productoId}/stock`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ change: -30 })
        .expect(200)
        .expect((res) => {
          expect(res.body.stock).toBe(120); // 150 - 30
        });
    });

    it('debería permitir stock negativo y advertir', () => {
      return request(app.getHttpServer())
        .patch(`/api/productos/${productoId}/stock`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ change: -130 })
        .expect(200)
        .expect((res) => {
          expect(res.body.stock).toBe(-10); // 120 - 130
        });
    });

    it('debería obtener productos con stock bajo', () => {
      return request(app.getHttpServer())
        .get('/api/productos/low-stock')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('5. Soft Delete y Restore', () => {
    it('debería eliminar producto (soft delete)', () => {
      return request(app.getHttpServer())
        .delete(`/api/productos/${productoId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('debería restaurar producto eliminado', () => {
      return request(app.getHttpServer())
        .patch(`/api/productos/${productoId}/restore`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('no debería listar producto eliminado en listado activo', async () => {
      // Eliminar nuevamente
      await request(app.getHttpServer())
        .delete(`/api/productos/${productoId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      return request(app.getHttpServer())
        .get('/api/productos')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          const productoEliminado = res.body.find((p: any) => p.idProducto === productoId);
          expect(productoEliminado).toBeUndefined();
        });
    });
  });
});
