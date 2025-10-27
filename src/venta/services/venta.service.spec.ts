import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { VentaService } from './venta.service';
import { VentaRepositoryInterface } from '../repositories/interfaces/venta.repository.interface';
import { ProductoRepositoryInterface } from '../../producto/repositories/interfaces/producto-interface.repository';
import { IUserRepository } from '../../users/interfaces/users.repository.interface';
import { IAuditoriaService } from '../../auditoria/interfaces/auditoria.service.interface';
import { VENTA_REPOSITORY, PRODUCTO_REPOSITORY, USUARIO_REPOSITORY } from '../../constants';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { MetodoPago } from '../enums/metodo-pago.enum';
import { Venta } from '../entities/venta.entity';
import { UserRole } from '../../users/helpers/enum.roles';

describe('VentaService', () => {
  let service: VentaService;
  let ventaRepository: jest.Mocked<VentaRepositoryInterface>;
  let productoRepository: jest.Mocked<ProductoRepositoryInterface>;
  let usuarioRepository: jest.Mocked<IUserRepository>;
  let auditoriaService: jest.Mocked<IAuditoriaService>;
  let dataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  const mockUsuario = {
    id: 1,
    email: 'test@test.com',
    nombre: 'Test',
    apellido: 'User',
    role: UserRole.OWNER,
  };

  const mockProducto = {
    idProducto: 1,
    nombre: 'Producto Test',
    precio: 100,
    stock: 50,
  };

  beforeEach(async () => {
    // Mock QueryRunner
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
      },
    } as any;

    // Mock DataSource
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    // Mock repositories
    ventaRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByUsuario: jest.fn(),
      save: jest.fn(),
      updateVenta: jest.fn(),
    } as any;

    productoRepository = {
      findOneActive: jest.fn(),
      updateStock: jest.fn(),
    } as any;

    usuarioRepository = {
      findById: jest.fn(),
    } as any;

    auditoriaService = {
      registrarEvento: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentaService,
        { provide: VENTA_REPOSITORY, useValue: ventaRepository },
        { provide: PRODUCTO_REPOSITORY, useValue: productoRepository },
        { provide: USUARIO_REPOSITORY, useValue: usuarioRepository },
        { provide: 'IAuditoriaService', useValue: auditoriaService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<VentaService>(VentaService);
  });

  describe('create', () => {
    const createVentaDto: CreateVentaDto = {
      metodoPago: MetodoPago.EFECTIVO,
      detalles: [{ idProducto: 1, cantidad: 10 }],
    };

    it('debería crear una venta exitosamente', async () => {
      const mockVenta = { idVenta: 1, total: 1000 } as Venta;

      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      productoRepository.findOneActive.mockResolvedValue(mockProducto as any);
      ventaRepository.save.mockResolvedValue(mockVenta);
      ventaRepository.findOne.mockResolvedValue(mockVenta);

      const result = await service.create(createVentaDto, mockUsuario.id);

      expect(result).toBeDefined();
      expect(usuarioRepository.findById).toHaveBeenCalledWith(mockUsuario.id);
      expect(productoRepository.findOneActive).toHaveBeenCalledWith(1);
      expect(productoRepository.updateStock).toHaveBeenCalledWith(1, -10);
      expect(auditoriaService.registrarEvento).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      usuarioRepository.findById.mockResolvedValue(null);

      await expect(service.create(createVentaDto, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar NotFoundException si el producto no existe', async () => {
      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      productoRepository.findOneActive.mockResolvedValue(null);

      await expect(service.create(createVentaDto, mockUsuario.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar BadRequestException si el stock es insuficiente', async () => {
      const productoSinStock = { ...mockProducto, stock: 5 };
      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      productoRepository.findOneActive.mockResolvedValue(productoSinStock as any);

      await expect(service.create(createVentaDto, mockUsuario.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(productoRepository.updateStock).not.toHaveBeenCalled();
    });

    it('debería calcular el total correctamente con múltiples productos', async () => {
      const multiProductDto: CreateVentaDto = {
        metodoPago: MetodoPago.TARJETA_CREDITO,
        detalles: [
          { idProducto: 1, cantidad: 10 },
          { idProducto: 2, cantidad: 5 },
        ],
      };

      const mockProducto2 = { idProducto: 2, nombre: 'Producto 2', precio: 200, stock: 20 };

      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      productoRepository.findOneActive
        .mockResolvedValueOnce(mockProducto as any)
        .mockResolvedValueOnce(mockProducto2 as any);

      const mockVenta = { idVenta: 1, total: 2000 } as Venta;
      ventaRepository.save.mockResolvedValue(mockVenta);
      ventaRepository.findOne.mockResolvedValue(mockVenta);

      await service.create(multiProductDto, mockUsuario.id);

      expect(productoRepository.updateStock).toHaveBeenCalledWith(1, -10);
      expect(productoRepository.updateStock).toHaveBeenCalledWith(2, -5);
    });

    it('debería lanzar BadRequestException si falla al guardar', async () => {
      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      productoRepository.findOneActive.mockResolvedValue(mockProducto as any);
      ventaRepository.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(createVentaDto, mockUsuario.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debería validar stock antes de procesar la venta', async () => {
      const ventaGrande: CreateVentaDto = {
        metodoPago: MetodoPago.EFECTIVO,
        detalles: [{ idProducto: 1, cantidad: 100 }],
      };

      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      productoRepository.findOneActive.mockResolvedValue(mockProducto as any);

      await expect(service.create(ventaGrande, mockUsuario.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(ventaRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las ventas', async () => {
      const mockVentas = [{ idVenta: 1 }, { idVenta: 2 }] as Venta[];
      ventaRepository.findAll.mockResolvedValue(mockVentas);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(ventaRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar una venta por ID', async () => {
      const mockVenta = { idVenta: 1 } as Venta;
      ventaRepository.findOne.mockResolvedValue(mockVenta);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(ventaRepository.findOne).toHaveBeenCalledWith(1);
    });

    it('debería lanzar NotFoundException si la venta no existe', async () => {
      ventaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUsuario', () => {
    it('debería retornar ventas de un usuario específico', async () => {
      const mockVentas = [{ idVenta: 1 }] as Venta[];
      ventaRepository.findByUsuario.mockResolvedValue(mockVentas);

      const result = await service.findByUsuario(1);

      expect(result).toBeDefined();
      expect(ventaRepository.findByUsuario).toHaveBeenCalledWith(1);
    });
  });
});
