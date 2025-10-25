import { Test, TestingModule } from '@nestjs/testing';
import { VentaRepository } from './venta.repository';
import { DataSource, Repository } from 'typeorm';
import { Venta } from '../entities/venta.entity';
import { DetalleVenta } from '../entities/detalle-venta.entity';
import { MetodoPago } from '../enums/metodo-pago.enum';

describe('VentaRepository', () => {
  let repository: VentaRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockVentaRepo: jest.Mocked<Repository<Venta>>;

  const ventaMock: Venta = {
    idVenta: 1,
    metodoPago: MetodoPago.EFECTIVO,
    total: 150,
    fechaCreacion: new Date(),
    usuario: null as any,
    detalles: [],
  };

  beforeEach(async () => {
    mockVentaRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockVentaRepo),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentaRepository,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<VentaRepository>(VentaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    // CASO 1: Retorna todas las ventas ordenadas por fecha
    it('debería retornar todas las ventas ordenadas por fecha descendente', async () => {
      const ventas = [ventaMock];
      mockVentaRepo.find.mockResolvedValue(ventas);

      const result = await repository.findAll();

      expect(result).toEqual(ventas);
      expect(mockVentaRepo.find).toHaveBeenCalledWith({
        relations: ['detalles', 'detalles.producto', 'usuario'],
        order: { fechaCreacion: 'DESC' },
      });
    });

    // CASO 2: Retorna array vacío si no hay ventas
    it('debería retornar array vacío cuando no hay ventas', async () => {
      mockVentaRepo.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    // CASO 3: Retorna venta existente con relaciones
    it('debería retornar venta cuando existe', async () => {
      mockVentaRepo.findOne.mockResolvedValue(ventaMock);

      const result = await repository.findOne(1);

      expect(result).toEqual(ventaMock);
      expect(mockVentaRepo.findOne).toHaveBeenCalledWith({
        where: { idVenta: 1 },
        relations: ['detalles', 'detalles.producto', 'usuario'],
      });
    });

    // CASO 4: Retorna null cuando no existe (Valores Límite)
    it('debería retornar null cuando venta no existe', async () => {
      mockVentaRepo.findOne.mockResolvedValue(null);

      const result = await repository.findOne(999);

      expect(result).toBeNull();
      expect(mockVentaRepo.findOne).toHaveBeenCalledWith({
        where: { idVenta: 999 },
        relations: ['detalles', 'detalles.producto', 'usuario'],
      });
    });
  });

  describe('findByUsuario', () => {
    // CASO 5: Retorna ventas filtradas por usuario
    it('debería retornar ventas de un usuario específico', async () => {
      const ventas = [ventaMock];
      mockVentaRepo.find.mockResolvedValue(ventas);

      const result = await repository.findByUsuario(1);

      expect(result).toEqual(ventas);
      expect(mockVentaRepo.find).toHaveBeenCalledWith({
        where: { usuario: { id: 1 } },
        relations: ['detalles', 'detalles.producto', 'usuario'],
        order: { fechaCreacion: 'DESC' },
      });
    });

    // CASO 6: Retorna array vacío si usuario no tiene ventas
    it('debería retornar array vacío cuando usuario no tiene ventas', async () => {
      mockVentaRepo.find.mockResolvedValue([]);

      const result = await repository.findByUsuario(999);

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    // CASO 7: Guarda venta correctamente
    it('debería crear y guardar una venta', async () => {
      mockVentaRepo.create.mockReturnValue(ventaMock);
      mockVentaRepo.save.mockResolvedValue(ventaMock);

      const result = await repository.save(ventaMock);

      expect(result).toEqual(ventaMock);
      expect(mockVentaRepo.create).toHaveBeenCalledWith(ventaMock);
      expect(mockVentaRepo.save).toHaveBeenCalledWith(ventaMock);
    });
  });

  describe('updateVenta', () => {
    // CASO 8: Actualiza venta existente
    it('debería actualizar venta y retornar entidad actualizada', async () => {
      const ventaActualizada = { ...ventaMock, total: 200 };
      mockVentaRepo.update.mockResolvedValue({ affected: 1 } as any);
      mockVentaRepo.findOne.mockResolvedValue(ventaActualizada);

      const result = await repository.updateVenta(1, ventaActualizada);

      expect(result).toEqual(ventaActualizada);
      expect(mockVentaRepo.update).toHaveBeenCalledWith(1, ventaActualizada);
      expect(mockVentaRepo.findOne).toHaveBeenCalledWith({
        where: { idVenta: 1 },
        relations: ['usuario', 'detalles', 'detalles.producto'],
      });
    });

    // CASO 9: Retorna null cuando venta no existe (Valores Límite)
    it('debería retornar null si venta no existe después de actualizar', async () => {
      mockVentaRepo.update.mockResolvedValue({ affected: 0 } as any);
      mockVentaRepo.findOne.mockResolvedValue(null);

      const result = await repository.updateVenta(999, ventaMock);

      expect(result).toBeNull();
    });
  });
});
