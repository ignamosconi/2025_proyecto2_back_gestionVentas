import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * E2E Tests para Proceso Central: GESTIÓN DE PROVEEDORES
 *
 * Flujos críticos:
 * 1. CRUD de Proveedores
 * 2. Asociación Producto-Proveedor (Many-to-Many con código)
 * 3. Consulta de productos por proveedor
 * 4. Consulta de proveedores por producto
 */
describe('Proveedores Flow (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerToken: string;
  let proveedorId: number;
  let productoId: number;
  let productoProveedorId: number;
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

    // Crear marca, línea y producto para tests
    const marcaRes = await request(app.getHttpServer())
      .post('/api/catalogo/marcas')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        nombre: `Marca-Proveedor-${Date.now()}`,
        descripcion: 'Marca para test de proveedor',
      });
    marcaId = marcaRes.body.id;

    const lineaRes = await request(app.getHttpServer())
      .post('/api/catalogo/lineas')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        nombre: `Linea-Proveedor-${Date.now()}`,
        descripcion: 'Línea para test de proveedor',
      });
    lineaId = lineaRes.body.id;

    // Asociar marca-línea
    await request(app.getHttpServer())
      .post('/api/catalogo/marca-linea/assign')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ marcaId, lineaId });

    // Crear producto
    const productoRes = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        nombre: `Producto-Proveedor-${Date.now()}`,
        precio: 500,
        stock: 50,
        alertaStock: 5,
        idMarca: marcaId,
        idLinea: lineaId,
      });
    productoId = productoRes.body.idProducto;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (dataSource) {
      if (productoProveedorId) {
        await dataSource.query(`DELETE FROM producto_proveedor WHERE "idProductoProveedor" = ${productoProveedorId}`);
      }
      if (productoId) {
        await dataSource.query(`DELETE FROM producto WHERE "idProducto" = ${productoId}`);
      }
      if (proveedorId) {
        await dataSource.query(`DELETE FROM proveedor WHERE "idProveedor" = ${proveedorId}`);
      }
      if (marcaId) {
        await dataSource.query(`DELETE FROM marca_linea WHERE "marcaId" = ${marcaId}`);
        await dataSource.query(`DELETE FROM marca WHERE id = ${marcaId}`);
      }
      if (lineaId) {
        await dataSource.query(`DELETE FROM linea WHERE id = ${lineaId}`);
      }
    }
    await app.close();
  });

  describe('1. CRUD de Proveedores', () => {
    const proveedorData = {
      nombre: `Proveedor-Test-${Date.now()}`,
      contacto: 'Juan Pérez',
      telefono: '+54 9 11 5555-6666',
      email: 'proveedor@test.com',
      direccion: 'Av. Proveedor 456',
    };

    it('debería crear un nuevo proveedor', () => {
      return request(app.getHttpServer())
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(proveedorData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('idProveedor');
          expect(res.body.nombre).toBe(proveedorData.nombre);
          expect(res.body.email).toBe(proveedorData.email);
          proveedorId = res.body.idProveedor;
        });
    });

    it('debería rechazar proveedor con nombre duplicado', () => {
      return request(app.getHttpServer())
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(proveedorData)
        .expect(409);
    });

    it('debería obtener proveedor por ID', () => {
      return request(app.getHttpServer())
        .get(`/api/proveedores/${proveedorId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.idProveedor).toBe(proveedorId);
          expect(res.body.nombre).toBe(proveedorData.nombre);
        });
    });

    it('debería listar todos los proveedores activos', () => {
      return request(app.getHttpServer())
        .get('/api/proveedores')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('debería actualizar proveedor existente', () => {
      const updateData = {
        telefono: '+54 9 11 9999-8888',
        email: 'proveedor.nuevo@test.com',
      };

      return request(app.getHttpServer())
        .patch(`/api/proveedores/${proveedorId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.telefono).toBe(updateData.telefono);
          expect(res.body.email).toBe(updateData.email);
        });
    });
  });

  describe('2. Asociación Producto-Proveedor', () => {
    const productoProveedorData = {
      idProducto: 0,
      idProveedor: 0,
      codigoProveedor: `COD-${Date.now()}`,
    };

    it('debería asociar producto con proveedor', () => {
      productoProveedorData.idProducto = productoId;
      productoProveedorData.idProveedor = proveedorId;

      return request(app.getHttpServer())
        .post('/api/producto-proveedor')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(productoProveedorData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('idProductoProveedor');
          expect(res.body.idProducto).toBe(productoId);
          expect(res.body.idProveedor).toBe(proveedorId);
          expect(res.body.codigoProveedor).toBe(productoProveedorData.codigoProveedor);
          productoProveedorId = res.body.idProductoProveedor;
        });
    });

    it('debería rechazar asociación duplicada', () => {
      return request(app.getHttpServer())
        .post('/api/producto-proveedor')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(productoProveedorData)
        .expect(409);
    });

    it('debería rechazar asociación con producto inexistente', () => {
      return request(app.getHttpServer())
        .post('/api/producto-proveedor')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          idProducto: 99999,
          idProveedor: proveedorId,
          codigoProveedor: 'COD-INVALID',
        })
        .expect(404);
    });

    it('debería rechazar asociación con proveedor inexistente', () => {
      return request(app.getHttpServer())
        .post('/api/producto-proveedor')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          idProducto: productoId,
          idProveedor: 99999,
          codigoProveedor: 'COD-INVALID-2',
        })
        .expect(404);
    });
  });

  describe('3. Consultas de Relaciones', () => {
    it('debería obtener productos de un proveedor', () => {
      return request(app.getHttpServer())
        .get(`/api/producto-proveedor/proveedor/${proveedorId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].idProveedor).toBe(proveedorId);
        });
    });

    it('debería obtener proveedores de un producto', () => {
      return request(app.getHttpServer())
        .get(`/api/producto-proveedor/producto/${productoId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].idProducto).toBe(productoId);
        });
    });

    it('debería actualizar código de proveedor', () => {
      const nuevoCodeigo = `COD-UPDATED-${Date.now()}`;

      return request(app.getHttpServer())
        .patch(`/api/producto-proveedor/${productoProveedorId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ codigoProveedor: nuevoCodeigo })
        .expect(200)
        .expect((res) => {
          expect(res.body.codigoProveedor).toBe(nuevoCodeigo);
        });
    });
  });

  describe('4. Soft Delete y Restore', () => {
    it('debería eliminar asociación producto-proveedor', () => {
      return request(app.getHttpServer())
        .delete(`/api/producto-proveedor/${productoProveedorId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('debería restaurar asociación eliminada', () => {
      return request(app.getHttpServer())
        .patch(`/api/producto-proveedor/${productoProveedorId}/restore`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('debería eliminar proveedor (soft delete)', () => {
      return request(app.getHttpServer())
        .delete(`/api/proveedores/${proveedorId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('debería restaurar proveedor eliminado', () => {
      return request(app.getHttpServer())
        .patch(`/api/proveedores/${proveedorId}/restore`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });
  });
});
