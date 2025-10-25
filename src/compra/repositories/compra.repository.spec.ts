import { Test, TestingModule } from '@nestjs/testing';
import { CompraRepository } from './compra.repository';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Compra } from '../entities/compra.entity';
import { DetalleCompra } from '../entities/detalle-compra.entity';
import { MetodoPagoCompraEnum } from '../helpers/metodo-pago-compra.enum';

describe('CompraRepository', () => {
  let repository: CompraRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockCompraRepo: jest.Mocked<Repository<Compra>>;
  let mockDetalleRepo: jest.Mocked<Repository<DetalleCompra>>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  const compraMock: Compra = {
    idCompra: 1,
    metodoPago: MetodoPagoCompraEnum.EFECTIVO,
    total: 100,
    fechaCreacion: new Date(),
    usuario: null as any,
    proveedor: null as any,
    detalles: [],
  };

  beforeEach(async () => {
    mockCompraRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    mockDetalleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as any;

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        remove: jest.fn(),
      } as any,
    } as any;

    mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === Compra) return mockCompraRepo;
        if (entity === DetalleCompra) return mockDetalleRepo;
        return {} as any;
      }),
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompraRepository,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<CompraRepository>(CompraRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    // CASO 1: Retorna todas las compras con relaciones
    it('debería retornar todas las compras ordenadas por fecha descendente', async () => {
      const compras = [compraMock];
      mockCompraRepo.find.mockResolvedValue(compras);

      const result = await repository.findAll();

      expect(result).toEqual(compras);
      expect(mockCompraRepo.find).toHaveBeenCalledWith({
        relations: ['detalles', 'detalles.producto', 'proveedor', 'usuario'],
        order: { fechaCreacion: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    // CASO 2: Retorna compra existente con relaciones
    it('debería retornar compra cuando existe', async () => {
      mockCompraRepo.findOne.mockResolvedValue(compraMock);

      const result = await repository.findOne(1);

      expect(result).toEqual(compraMock);
      expect(mockCompraRepo.findOne).toHaveBeenCalledWith({
        where: { idCompra: 1 },
        relations: ['detalles', 'detalles.producto', 'proveedor', 'usuario'],
      });
    });

    // CASO 3: Retorna null cuando no existe (Valores Límite)
    it('debería retornar null cuando compra no existe', async () => {
      mockCompraRepo.findOne.mockResolvedValue(null);

      const result = await repository.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUsuario', () => {
    // CASO 4: Retorna compras de un usuario específico
    it('debería retornar compras filtradas por usuario', async () => {
      const compras = [compraMock];
      mockCompraRepo.find.mockResolvedValue(compras);

      const result = await repository.findByUsuario(1);

      expect(result).toEqual(compras);
      expect(mockCompraRepo.find).toHaveBeenCalledWith({
        where: { usuario: { id: 1 } },
        relations: ['detalles', 'detalles.producto', 'proveedor', 'usuario'],
        order: { fechaCreacion: 'DESC' },
      });
    });

    // CASO 5: Retorna array vacío si usuario no tiene compras
    it('debería retornar array vacío cuando usuario no tiene compras', async () => {
      mockCompraRepo.find.mockResolvedValue([]);

      const result = await repository.findByUsuario(999);

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    // CASO 6: Guarda compra correctamente
    it('debería crear y guardar una compra', async () => {
      mockCompraRepo.create.mockReturnValue(compraMock);
      mockCompraRepo.save.mockResolvedValue(compraMock);

      const result = await repository.save(compraMock);

      expect(result).toEqual(compraMock);
      expect(mockCompraRepo.create).toHaveBeenCalledWith(compraMock);
      expect(mockCompraRepo.save).toHaveBeenCalledWith(compraMock);
    });
  });

  describe('updateCompra', () => {
    // CASO 7: Actualiza compra existente
    it('debería actualizar compra y retornar entidad actualizada', async () => {
      const compraActualizada = { ...compraMock, total: 200 };
      mockCompraRepo.update.mockResolvedValue({ affected: 1 } as any);
      mockCompraRepo.findOne.mockResolvedValue(compraActualizada);

      const result = await repository.updateCompra(1, compraActualizada);

      expect(result).toEqual(compraActualizada);
      expect(mockCompraRepo.update).toHaveBeenCalledWith(1, compraActualizada);
      expect(mockCompraRepo.findOne).toHaveBeenCalledWith({
        where: { idCompra: 1 },
        relations: ['usuario', 'proveedor', 'detalles', 'detalles.producto'],
      });
    });

    // CASO 8: Retorna null cuando compra no existe
    it('debería retornar null si compra no existe después de actualizar', async () => {
      mockCompraRepo.update.mockResolvedValue({ affected: 0 } as any);
      mockCompraRepo.findOne.mockResolvedValue(null);

      const result = await repository.updateCompra(999, compraMock);

      expect(result).toBeNull();
    });
  });

  describe('getQueryRunner', () => {
    // CASO 9: Retorna QueryRunner para transacciones
    it('debería retornar QueryRunner del DataSource', () => {
      const result = repository.getQueryRunner();

      expect(result).toBe(mockQueryRunner);
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
    });
  });

  describe('removeDetallesInTransaction', () => {
    // CASO 10: Elimina detalles en transacción
    it('debería eliminar detalles usando el manager del QueryRunner', async () => {
      const detalles = [new DetalleCompra(), new DetalleCompra()];
      mockQueryRunner.manager.remove.mockResolvedValue(detalles);

      await repository.removeDetallesInTransaction(detalles, mockQueryRunner);

      expect(mockQueryRunner.manager.remove).toHaveBeenCalledWith(detalles);
    });

    // CASO 11: No hace nada si array está vacío (Valores Límite)
    it('debería no hacer nada cuando el array de detalles está vacío', async () => {
      await repository.removeDetallesInTransaction([], mockQueryRunner);

      expect(mockQueryRunner.manager.remove).not.toHaveBeenCalled();
    });
  });
});
