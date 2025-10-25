import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ProductoProveedorRepository } from './producto-proveedor.repository';
import { ProductoProveedor } from '../entities/producto-proveedor.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateProductoProveedorDto } from '../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../dto/update-producto-proveedor.dto';

describe('ProductoProveedorRepository', () => {
  let repository: ProductoProveedorRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<ProductoProveedor>>;
  let mockQueryBuilder: any;

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
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      withDeleted: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    };

    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
      recover: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoProveedorRepository,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<ProductoProveedorRepository>(ProductoProveedorRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear vínculo producto-proveedor', async () => {
      const createDto: CreateProductoProveedorDto = {
        idProducto: 1,
        idProveedor: 1,
        codigoProveedor: 'PROV-001',
      };

      mockTypeOrmRepo.create.mockReturnValue(productoProveedorMock as any);
      mockTypeOrmRepo.save.mockResolvedValue(productoProveedorMock);

      const result = await repository.create(createDto);

      expect(result).toEqual(productoProveedorMock);
    });
  });

  describe('findOne - Valores Límite', () => {
    it('debería retornar vínculo cuando existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(productoProveedorMock);

      const result = await repository.findOne(1);

      expect(result).toEqual(productoProveedorMock);
    });

    it('debería retornar null cuando no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('findByProducto', () => {
    it('debería retornar vínculos de un producto específico', async () => {
      const vinculos = [productoProveedorMock];
      mockQueryBuilder.getMany.mockResolvedValue(vinculos);

      const result = await repository.findByProducto(1);

      expect(result).toEqual(vinculos);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('pp.idProducto = :idProducto', { idProducto: 1 });
    });

    it('debería retornar array vacío si producto no tiene proveedores', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await repository.findByProducto(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByProveedor', () => {
    it('debería retornar vínculos de un proveedor específico', async () => {
      const vinculos = [productoProveedorMock];
      mockQueryBuilder.getMany.mockResolvedValue(vinculos);

      const result = await repository.findByProveedor(1);

      expect(result).toEqual(vinculos);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('pp.idProveedor = :idProveedor', { idProveedor: 1 });
    });
  });

  describe('update - Valores Límite', () => {
    const updateDto: UpdateProductoProveedorDto = { codigoProveedor: 'PROV-002' };

    it('debería actualizar vínculo existente', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      mockQueryBuilder.getOne.mockResolvedValue({ ...productoProveedorMock, ...updateDto });

      const result = await repository.update(1, updateDto);

      expect(result.codigoProveedor).toBe('PROV-002');
    });

    it('debería lanzar NotFoundException cuando vínculo no existe', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(repository.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete - Transición de Estados', () => {
    it('debería eliminar vínculo existente', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(productoProveedorMock);
      mockTypeOrmRepo.softRemove.mockResolvedValue(productoProveedorMock);

      await expect(repository.softDelete(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando vínculo no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(repository.softDelete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore - Transición de Estados', () => {
    it('debería restaurar vínculo eliminado', async () => {
      const vinculoEliminado = { ...productoProveedorMock, deletedAt: new Date() };
      mockTypeOrmRepo.findOne.mockResolvedValue(vinculoEliminado);
      mockTypeOrmRepo.recover.mockResolvedValue(productoProveedorMock);

      await expect(repository.restore(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando vínculo no existe', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      await expect(repository.restore(999)).rejects.toThrow(NotFoundException);
    });
  });
});
