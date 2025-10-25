import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoRepositoryInterface } from '../repositories/interfaces/producto-interface.repository';
import { ProductoProveedorRepositoryInterface } from '../../proveedor/repositories/interfaces/producto-proveedor.repository.interface';
import { MarcaServiceInterface } from '../../catalogo/services/interfaces/marca.service.interface';
import { LineaServiceInterface } from '../../catalogo/services/interfaces/linea.service.interface';
import { MarcaLineaServiceInterface } from '../../catalogo/services/interfaces/marca-linea.service.interface';
import { IUsersService } from '../../users/interfaces/users.service.interface';
import { IMailerService } from '../../mailer/interfaces/mailer.service.interface';
import { IS3Service } from '../../s3/interfaces/s3.service.interface';
import {
  PRODUCTO_REPOSITORY,
  MARCA_SERVICE,
  LINEA_SERVICE,
  MARCA_LINEA_SERVICE,
  PRODUCTO_PROVEEDOR_REPOSITORY,
} from '../../constants';
import { Producto } from '../entities/producto.entity';
import { UpdateStockDto } from '../dto/update-stock.dto';

describe('ProductoService', () => {
  let service: ProductoService;
  let mockProductoRepo: jest.Mocked<ProductoRepositoryInterface>;
  let mockProductoProveedorRepo: jest.Mocked<ProductoProveedorRepositoryInterface>;
  let mockMarcaService: jest.Mocked<MarcaServiceInterface>;
  let mockLineaService: jest.Mocked<LineaServiceInterface>;
  let mockMarcaLineaService: jest.Mocked<MarcaLineaServiceInterface>;
  let mockUsersService: jest.Mocked<IUsersService>;
  let mockMailerService: jest.Mocked<IMailerService>;
  let mockS3Service: jest.Mocked<IS3Service>;

  const productoMock: Producto = {
    idProducto: 1,
    nombre: 'Producto Test',
    descripcion: 'Descripción test',
    precio: 100,
    stock: 50,
    alertaStock: 10,
    foto: '',
    idLinea: 1,
    idMarca: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    linea: null as any,
    marca: null as any,
    proveedores: [],
  };

  beforeEach(async () => {
    mockProductoRepo = {
      findAllActive: jest.fn(),
      findAllSoftDeleted: jest.fn(),
      findOneActive: jest.fn(),
      findOneInactive: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStock: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findLowStockProducts: jest.fn(),
    } as any;

    mockMarcaService = {
      findOneActive: jest.fn(),
    } as any;

    mockLineaService = {
      findOneActive: jest.fn(),
      create: jest.fn(),
    } as any;

    mockMarcaLineaService = {
      findAllByMarcaId: jest.fn(),
      assignLineaToMarca: jest.fn(),
    } as any;

    mockUsersService = {
      findAllOwners: jest.fn(),
    } as any;

    mockMailerService = {
      sendMail: jest.fn(),
    } as any;

    mockS3Service = {
      uploadFile: jest.fn(),
    } as any;

    mockProductoProveedorRepo = {
      findByProveedor: jest.fn(),
      findByProducto: jest.fn(),
      findOneByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        { provide: PRODUCTO_REPOSITORY, useValue: mockProductoRepo },
        { provide: PRODUCTO_PROVEEDOR_REPOSITORY, useValue: mockProductoProveedorRepo },
        { provide: MARCA_SERVICE, useValue: mockMarcaService },
        { provide: LINEA_SERVICE, useValue: mockLineaService },
        { provide: MARCA_LINEA_SERVICE, useValue: mockMarcaLineaService },
        { provide: 'IUsersService', useValue: mockUsersService },
        { provide: 'IMailerService', useValue: mockMailerService },
        { provide: 'IS3Service', useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    // CASO 1: Retorna todos los productos activos
    it('debería retornar todos los productos activos', async () => {
      const productos = [productoMock];
      mockProductoRepo.findAllActive.mockResolvedValue(productos);

      const result = await service.findAll();

      expect(result).toEqual(productos);
      expect(mockProductoRepo.findAllActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    // CASO 2: Retorna producto existente y activo
    it('debería retornar producto cuando existe y está activo', async () => {
      mockProductoRepo.findOneActive.mockResolvedValue(productoMock);

      const result = await service.findOne(1);

      expect(result).toEqual(productoMock);
      expect(mockProductoRepo.findOneActive).toHaveBeenCalledWith(1);
    });

    // CASO 3: Lanza NotFoundException cuando producto está inactivo
    it('debería lanzar NotFoundException cuando producto está inactivo', async () => {
      mockProductoRepo.findOneActive.mockResolvedValue(null);
      mockProductoRepo.findOneInactive.mockResolvedValue({
        ...productoMock,
        deletedAt: new Date(),
      });

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(1)).rejects.toThrow(
        'Producto con ID 1 está inactivo.',
      );
    });

    // CASO 4: Lanza NotFoundException cuando producto no existe
    it('debería lanzar NotFoundException cuando producto no existe', async () => {
      mockProductoRepo.findOneActive.mockResolvedValue(null);
      mockProductoRepo.findOneInactive.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Producto con ID 999 no encontrado.',
      );
    });
  });

  describe('create - Tabla de Decisión (Marca × Línea)', () => {
    const bodyBase = {
      data: JSON.stringify({
        nombre: 'Producto Nuevo',
        precio: 100,
        stock: 50,
        alertaStock: 10,
        idMarca: 1,
      }),
    };

    // CASO 5: Creación con línea existente y vínculo válido
    it('debería crear producto con línea existente vinculada a marca', async () => {
      const body = {
        data: JSON.stringify({
          ...JSON.parse(bodyBase.data),
          idLinea: 1,
        }),
      };

      mockMarcaService.findOneActive.mockResolvedValue({} as any);
      mockLineaService.findOneActive.mockResolvedValue({} as any);
      mockMarcaLineaService.findAllByMarcaId.mockResolvedValue([
        { lineaId: 1 } as any,
      ]);
      mockProductoRepo.create.mockResolvedValue(productoMock);
      // Mock findOneActive después de crear (para obtener el producto con la imagen)
      mockProductoRepo.findOneActive.mockResolvedValue(productoMock);

      const result = await service.create(body);

      expect(result.idProducto).toBe(1);
      expect(mockProductoRepo.create).toHaveBeenCalled();
      expect(mockLineaService.create).not.toHaveBeenCalled();
    });

    // CASO 6: Falla cuando línea no está vinculada a marca
    it('debería lanzar BadRequestException cuando línea no está vinculada a marca', async () => {
      const body = {
        data: JSON.stringify({
          ...JSON.parse(bodyBase.data),
          idLinea: 2,
        }),
      };

      mockMarcaService.findOneActive.mockResolvedValue({} as any);
      mockLineaService.findOneActive.mockResolvedValue({} as any);
      mockMarcaLineaService.findAllByMarcaId.mockResolvedValue([
        { lineaId: 1 } as any,
      ]); // Solo existe vínculo con lineaId 1

      await expect(service.create(body)).rejects.toThrow(BadRequestException);
      await expect(service.create(body)).rejects.toThrow(
        'La Línea ID 2 no está vinculada a la Marca ID 1.',
      );
      expect(mockProductoRepo.create).not.toHaveBeenCalled();
    });

    // CASO 7: Creación con nueva línea (crea línea y vínculo)
    it('debería crear producto con nueva línea y establecer vínculo', async () => {
      const body = {
        data: JSON.stringify({
          ...JSON.parse(bodyBase.data),
          nombreNuevaLinea: 'Línea Nueva',
        }),
      };

      mockMarcaService.findOneActive.mockResolvedValue({} as any);
      mockLineaService.create.mockResolvedValue({ id: 5 } as any);
      mockMarcaLineaService.assignLineaToMarca.mockResolvedValue({} as any);
      const productoConNuevaLinea = { ...productoMock, idLinea: 5 };
      mockProductoRepo.create.mockResolvedValue(productoConNuevaLinea);
      // Mock findOneActive después de crear
      mockProductoRepo.findOneActive.mockResolvedValue(productoConNuevaLinea);

      const result = await service.create(body);

      expect(mockLineaService.create).toHaveBeenCalledWith({
        nombre: 'Línea Nueva',
        marcaId: 1,
      });
      expect(mockMarcaLineaService.assignLineaToMarca).toHaveBeenCalledWith({
        marcaId: 1,
        lineaId: 5,
      });
      expect(mockProductoRepo.create).toHaveBeenCalled();
    });

    // CASO 8: Falla cuando se proporciona línea existente Y nueva línea
    it('debería lanzar BadRequestException cuando se envían ambos: idLinea y nombreNuevaLinea', async () => {
      const body = {
        data: JSON.stringify({
          ...JSON.parse(bodyBase.data),
          idLinea: 1,
          nombreNuevaLinea: 'Línea Conflicto',
        }),
      };

      mockMarcaService.findOneActive.mockResolvedValue({} as any);

      await expect(service.create(body)).rejects.toThrow(BadRequestException);
      await expect(service.create(body)).rejects.toThrow(
        'Solo puede proporcionar un ID de línea existente O un nombre de línea nueva, no ambos.',
      );
      expect(mockProductoRepo.create).not.toHaveBeenCalled();
    });

    // CASO 9: Falla cuando no se proporciona línea ni nueva línea
    it('debería lanzar BadRequestException cuando no se proporciona línea', async () => {
      const body = { data: bodyBase.data };

      mockMarcaService.findOneActive.mockResolvedValue({} as any);

      await expect(service.create(body)).rejects.toThrow(BadRequestException);
      await expect(service.create(body)).rejects.toThrow(
        'Debe vincular el producto a una línea existente o crear una nueva (US 10).',
      );
    });

    // CASO 10: Falla cuando marca no existe
    it('debería lanzar NotFoundException cuando marca no existe', async () => {
      const body = {
        data: JSON.stringify({
          ...JSON.parse(bodyBase.data),
          idLinea: 1,
        }),
      };

      mockMarcaService.findOneActive.mockRejectedValue(
        new NotFoundException('Marca no encontrada'),
      );

      await expect(service.create(body)).rejects.toThrow(NotFoundException);
      expect(mockProductoRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const bodyUpdate = {
      data: JSON.stringify({
        precio: 150,
      }),
    };

    // CASO 11: Actualización exitosa sin cambiar marca/línea
    it('debería actualizar producto sin cambiar marca/línea', async () => {
      const productoActualizado = { ...productoMock, precio: 150 };

      // Primera llamada en validateLineAndMarkForUpdate
      mockProductoRepo.findOneActive.mockResolvedValueOnce(productoMock);
      // Segunda llamada después de actualizar
      mockProductoRepo.findOneActive.mockResolvedValueOnce(productoActualizado);

      mockMarcaLineaService.findAllByMarcaId.mockResolvedValue([
        { lineaId: 1 } as any,
      ]);
      mockProductoRepo.update.mockResolvedValue(undefined);

      const result = await service.update(1, bodyUpdate);

      expect(result.precio).toBe(150);
      expect(mockProductoRepo.update).toHaveBeenCalledWith(1, { precio: 150 });
    });

    // CASO 12: Falla cuando producto no existe
    it('debería lanzar NotFoundException cuando producto no existe', async () => {
      mockProductoRepo.findOneActive.mockResolvedValue(null);

      await expect(service.update(999, bodyUpdate)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductoRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStock - Análisis de Valores Límite', () => {
    // CASO 13: Incremento de stock normal
    it('debería incrementar stock exitosamente', async () => {
      const updateDto: UpdateStockDto = { change: 20 };
      mockProductoRepo.findOneActive.mockResolvedValue(productoMock);
      mockProductoRepo.updateStock.mockResolvedValue({
        ...productoMock,
        stock: 70,
      });

      const result = await service.updateStock(1, updateDto);

      expect(result.stock).toBe(70);
      expect(mockProductoRepo.updateStock).toHaveBeenCalledWith(1, 20);
      expect(mockMailerService.sendMail).not.toHaveBeenCalled();
    });

    // CASO 14: Decremento que deja stock en límite de alerta (envía email)
    it('debería enviar alerta cuando stock llega al límite de alerta', async () => {
      const productoConStock = { ...productoMock, stock: 15, alertaStock: 10 };
      const updateDto: UpdateStockDto = { change: -5 }; // 15 - 5 = 10 (límite)

      mockProductoRepo.findOneActive.mockResolvedValue(productoConStock);
      mockProductoRepo.updateStock.mockResolvedValue({
        ...productoConStock,
        stock: 10,
      });
      mockUsersService.findAllOwners.mockResolvedValue([
        { email: 'owner@test.com' } as any,
      ]);
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.updateStock(1, updateDto);

      expect(result.stock).toBe(10);
      expect(mockUsersService.findAllOwners).toHaveBeenCalled();
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        'owner@test.com',
        expect.stringContaining('Alerta de Stock Bajo'),
        expect.any(String),
      );
    });

    // CASO 15: Falla cuando stock quedaría negativo (límite inferior)
    it('debería lanzar BadRequestException cuando stock quedaría negativo', async () => {
      const productoConStock = { ...productoMock, stock: 5 };
      const updateDto: UpdateStockDto = { change: -10 }; // 5 - 10 = -5

      mockProductoRepo.findOneActive.mockResolvedValue(productoConStock);

      await expect(service.updateStock(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateStock(1, updateDto)).rejects.toThrow(
        'La operación dejaría el stock del producto en negativo (-5).',
      );
      expect(mockProductoRepo.updateStock).not.toHaveBeenCalled();
    });

    // CASO 16: Falla cuando producto no existe
    it('debería lanzar NotFoundException cuando producto no existe', async () => {
      const updateDto: UpdateStockDto = { change: 10 };
      mockProductoRepo.findOneActive.mockResolvedValue(null);

      await expect(service.updateStock(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductoRepo.updateStock).not.toHaveBeenCalled();
    });
  });

  describe('softDelete - Transición de Estados', () => {
    // CASO 17: Eliminación exitosa
    it('debería eliminar producto exitosamente', async () => {
      mockProductoRepo.softDelete.mockResolvedValue(undefined);

      await expect(service.softDelete(1)).resolves.not.toThrow();

      expect(mockProductoRepo.softDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('restore', () => {
    // CASO 18: Restauración exitosa
    it('debería restaurar producto eliminado', async () => {
      mockProductoRepo.restore.mockResolvedValue(undefined);

      await expect(service.restore(1)).resolves.not.toThrow();

      expect(mockProductoRepo.restore).toHaveBeenCalledWith(1);
    });
  });

  describe('findLowStockProducts', () => {
    // CASO 19: Retorna productos con stock bajo
    it('debería retornar productos con stock bajo', async () => {
      const productosStockBajo = [
        { ...productoMock, stock: 5, alertaStock: 10 },
      ];
      mockProductoRepo.findLowStockProducts.mockResolvedValue(
        productosStockBajo,
      );

      const result = await service.findLowStockProducts();

      expect(result).toEqual(productosStockBajo);
      expect(mockProductoRepo.findLowStockProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllSoftDeleted', () => {
    // CASO 20: Retorna productos eliminados
    it('debería retornar productos eliminados', async () => {
      const productosEliminados = [
        { ...productoMock, deletedAt: new Date() },
      ];
      mockProductoRepo.findAllSoftDeleted.mockResolvedValue(
        productosEliminados,
      );

      const result = await service.findAllSoftDeleted();

      expect(result).toEqual(productosEliminados);
      expect(mockProductoRepo.findAllSoftDeleted).toHaveBeenCalledTimes(1);
    });
  });
});
