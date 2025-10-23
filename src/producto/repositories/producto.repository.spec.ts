import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ProductoRepository } from './producto.repository';
import { Producto } from '../entities/producto.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';

describe('ProductoRepository', () => {
  let repository: ProductoRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<Producto>>;

  const productoMock: Producto = {
    idProducto: 1,
    nombre: 'Zapatillas Nike',
    descripcion: 'Zapatillas deportivas',
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
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as unknown as SelectQueryBuilder<Producto>;

    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoRepository,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<ProductoRepository>(ProductoRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear producto exitosamente', async () => {
      const createDto: CreateProductoDto = {
        nombre: 'Zapatillas',
        precio: 100,
        stock: 50,
        alertaStock: 10,
        idLinea: 1,
        idMarca: 1,
      };

      mockTypeOrmRepo.create.mockReturnValue(productoMock as any);
      mockTypeOrmRepo.save.mockResolvedValue(productoMock);

      const result = await repository.create(createDto);

      expect(result).toEqual(productoMock);
    });
  });

  describe('update - Valores Límite', () => {
    const updateDto: UpdateProductoDto = { precio: 120 };

    it('debería actualizar producto cuando affected = 1', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      mockTypeOrmRepo.findOne.mockResolvedValue({ ...productoMock, precio: 120 } as Producto);

      const result = await repository.update(1, updateDto);

      expect(result.precio).toBe(120);
    });

    it('debería lanzar NotFoundException cuando affected = 0', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      await expect(repository.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStock - Transición de Estados', () => {
    it('debería incrementar stock correctamente', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(productoMock);
      mockTypeOrmRepo.save.mockResolvedValue({ ...productoMock, stock: 60 } as Producto);

      const result = await repository.updateStock(1, 10);

      expect(result.stock).toBe(60);
    });

    it('debería decrementar stock correctamente', async () => {
      const productoClone = { ...productoMock, stock: 50 };
      mockTypeOrmRepo.findOne.mockResolvedValue(productoClone);
      mockTypeOrmRepo.save.mockImplementation(async (producto: any) => producto);

      const result = await repository.updateStock(1, -5);

      expect(result.stock).toBe(45);
    });

    it('debería permitir stock negativo y advertir', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const productoConBajoStock = { ...productoMock, stock: 5 };

      mockTypeOrmRepo.findOne.mockResolvedValue(productoConBajoStock);
      mockTypeOrmRepo.save.mockResolvedValue({ ...productoConBajoStock, stock: -5 } as Producto);

      const result = await repository.updateStock(1, -10);

      expect(result.stock).toBe(-5);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('debería lanzar NotFoundException si producto no existe', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      await expect(repository.updateStock(999, 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete - Transición de Estados', () => {
    it('debería eliminar producto activo cuando affected = 1', async () => {
      mockTypeOrmRepo.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repository.softDelete(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando affected = 0', async () => {
      mockTypeOrmRepo.softDelete.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      await expect(repository.softDelete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore - Transición de Estados', () => {
    it('debería restaurar producto eliminado cuando affected = 1', async () => {
      mockTypeOrmRepo.restore.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repository.restore(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando affected = 0', async () => {
      mockTypeOrmRepo.restore.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      await expect(repository.restore(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLowStockProducts', () => {
    it('debería retornar productos con stock bajo el límite de alerta', async () => {
      const productosBajoStock = [
        { ...productoMock, stock: 5, alertaStock: 10 },
      ];

      const mockQueryBuilder = mockTypeOrmRepo.createQueryBuilder('producto') as any;
      mockQueryBuilder.getMany.mockResolvedValue(productosBajoStock);

      const result = await repository.findLowStockProducts();

      expect(result).toEqual(productosBajoStock);
    });
  });

  describe('findOneActive', () => {
    it('debería retornar producto activo con relaciones', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(productoMock);

      const result = await repository.findOneActive(1);

      expect(result).toEqual(productoMock);
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { idProducto: 1, deletedAt: expect.anything() },
        relations: ['linea', 'marca'],
      });
    });
  });
});
