import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProductoProveedorService } from './producto-proveedor.service';
import { ProductoProveedorRepositoryInterface } from '../repositories/interfaces/producto-proveedor.repository.interface';
import { ProductoServiceInterface } from '../../producto/services/interfaces/producto.service.interface';
import { ProveedorServiceInterface } from './interfaces/proveedor.service.interface';
import {
  PRODUCTO_PROVEEDOR_REPOSITORY,
  PRODUCTO_SERVICE,
  PROVEEDOR_SERVICE,
} from '../../constants';
import { ProductoProveedor } from '../entities/producto-proveedor.entity';
import { CreateProductoProveedorDto } from '../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../dto/update-producto-proveedor.dto';

describe('ProductoProveedorService', () => {
  let service: ProductoProveedorService;
  let mockRepository: jest.Mocked<ProductoProveedorRepositoryInterface>;
  let mockProductoService: jest.Mocked<ProductoServiceInterface>;
  let mockProveedorService: jest.Mocked<ProveedorServiceInterface>;

  const productoProveedorMock: ProductoProveedor = {
    idProductoProveedor: 1,
    idProducto: 1,
    idProveedor: 1,
    codigoProveedor: 'PROV-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    producto: null as any,
    proveedor: null as any,
  };

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findAllSoftDeleted: jest.fn(),
      findOne: jest.fn(),
      findByProducto: jest.fn(),
      findByProveedor: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as any;

    mockProductoService = {
      findOneActive: jest.fn(),
    } as any;

    mockProveedorService = {
      findOneActive: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoProveedorService,
        {
          provide: PRODUCTO_PROVEEDOR_REPOSITORY,
          useValue: mockRepository,
        },
        { provide: PRODUCTO_SERVICE, useValue: mockProductoService },
        { provide: PROVEEDOR_SERVICE, useValue: mockProveedorService },
      ],
    }).compile();

    service = module.get<ProductoProveedorService>(ProductoProveedorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    // CASO 1: Retorna todos los vínculos
    it('debería retornar todos los vínculos producto-proveedor', async () => {
      const vinculos = [productoProveedorMock];
      mockRepository.findAll.mockResolvedValue(vinculos);

      const result = await service.findAll();

      expect(result).toEqual(vinculos);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    // CASO 2: Retorna vínculo existente
    it('debería retornar vínculo cuando existe', async () => {
      mockRepository.findOne.mockResolvedValue(productoProveedorMock);

      const result = await service.findOne(1);

      expect(result).toEqual(productoProveedorMock);
      expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    });

    // CASO 3: Lanza excepción cuando vínculo no existe
    it('debería lanzar NotFoundException cuando vínculo no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'ProductoProveedor con id 999 no encontrado',
      );
    });
  });

  describe('findByProducto', () => {
    // CASO 4: Retorna vínculos de un producto
    it('debería retornar vínculos de un producto específico', async () => {
      const vinculos = [productoProveedorMock];
      mockRepository.findByProducto.mockResolvedValue(vinculos);

      const result = await service.findByProducto(1);

      expect(result).toEqual(vinculos);
      expect(mockRepository.findByProducto).toHaveBeenCalledWith(1);
    });
  });

  describe('findByProveedor', () => {
    // CASO 5: Retorna vínculos de un proveedor
    it('debería retornar vínculos de un proveedor específico', async () => {
      const vinculos = [productoProveedorMock];
      mockRepository.findByProveedor.mockResolvedValue(vinculos);

      const result = await service.findByProveedor(1);

      expect(result).toEqual(vinculos);
      expect(mockRepository.findByProveedor).toHaveBeenCalledWith(1);
    });
  });

  describe('create - Tabla de Decisión (Producto × Proveedor × Vínculo)', () => {
    const createDto: CreateProductoProveedorDto = {
      idProducto: 1,
      idProveedor: 1,
      codigoProveedor: 'PROV-NEW',
    };

    // CASO 6: Creación exitosa (producto existe, proveedor existe, sin vínculo previo)
    it('debería crear vínculo cuando producto y proveedor existen y no hay vínculo previo', async () => {
      mockProductoService.findOneActive.mockResolvedValue({} as any);
      mockProveedorService.findOneActive.mockResolvedValue({} as any);
      mockRepository.findByProducto.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(productoProveedorMock);

      const result = await service.create(createDto);

      expect(result).toEqual(productoProveedorMock);
      expect(mockProductoService.findOneActive).toHaveBeenCalledWith(1);
      expect(mockProveedorService.findOneActive).toHaveBeenCalledWith(1);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    // CASO 7: Falla cuando producto no existe
    it('debería lanzar NotFoundException cuando producto no existe', async () => {
      mockProductoService.findOneActive.mockRejectedValue(
        new NotFoundException('Producto no encontrado'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    // CASO 8: Falla cuando proveedor no existe
    it('debería lanzar NotFoundException cuando proveedor no existe', async () => {
      mockProductoService.findOneActive.mockResolvedValue({} as any);
      mockProveedorService.findOneActive.mockRejectedValue(
        new NotFoundException('Proveedor no encontrado'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    // CASO 9: Falla cuando vínculo ya existe (partición inválida - duplicado)
    it('debería lanzar ConflictException cuando vínculo ya existe', async () => {
      mockProductoService.findOneActive.mockResolvedValue({} as any);
      mockProveedorService.findOneActive.mockResolvedValue({} as any);
      mockRepository.findByProducto.mockResolvedValue([
        productoProveedorMock,
      ]);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'El proveedor ya está vinculado a este producto',
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    // CASO 10: Creación exitosa cuando producto tiene otros proveedores (no duplicado)
    it('debería crear vínculo cuando producto tiene otros proveedores diferentes', async () => {
      const otroVinculo = { ...productoProveedorMock, idProveedor: 2 };

      mockProductoService.findOneActive.mockResolvedValue({} as any);
      mockProveedorService.findOneActive.mockResolvedValue({} as any);
      mockRepository.findByProducto.mockResolvedValue([otroVinculo]);
      mockRepository.create.mockResolvedValue(productoProveedorMock);

      const result = await service.create(createDto);

      expect(result).toEqual(productoProveedorMock);
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductoProveedorDto = {
      codigoProveedor: 'PROV-UPDATED',
    };

    // CASO 11: Actualización exitosa
    it('debería actualizar vínculo existente', async () => {
      mockRepository.findOne.mockResolvedValue(productoProveedorMock);
      mockRepository.update.mockResolvedValue({
        ...productoProveedorMock,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result.codigoProveedor).toBe(updateDto.codigoProveedor);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    // CASO 12: Falla cuando vínculo no existe
    it('debería lanzar NotFoundException cuando vínculo no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete - Transición de Estados', () => {
    // CASO 13: Eliminación exitosa de vínculo activo
    it('debería eliminar vínculo activo exitosamente', async () => {
      mockRepository.findOne.mockResolvedValue(productoProveedorMock);
      mockRepository.softDelete.mockResolvedValue(undefined);

      await expect(service.softDelete(1)).resolves.not.toThrow();

      expect(mockRepository.findOne).toHaveBeenCalledWith(1);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
    });

    // CASO 14: Falla al eliminar vínculo inexistente
    it('debería lanzar NotFoundException al eliminar vínculo inexistente', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete(999)).rejects.toThrow(NotFoundException);
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    // CASO 15: Restauración de vínculo eliminado
    it('debería restaurar vínculo eliminado', async () => {
      mockRepository.restore.mockResolvedValue(undefined);

      await expect(service.restore(1)).resolves.not.toThrow();

      expect(mockRepository.restore).toHaveBeenCalledWith(1);
    });
  });

  describe('findAllSoftDeleted', () => {
    // CASO 16: Retorna vínculos eliminados
    it('debería retornar vínculos eliminados', async () => {
      const vinculosEliminados = [
        { ...productoProveedorMock, deletedAt: new Date() },
      ];
      mockRepository.findAllSoftDeleted.mockResolvedValue(vinculosEliminados);

      const result = await service.findAllSoftDeleted();

      expect(result).toEqual(vinculosEliminados);
      expect(mockRepository.findAllSoftDeleted).toHaveBeenCalledTimes(1);
    });
  });
});
