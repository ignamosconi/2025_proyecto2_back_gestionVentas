import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { CompraService } from './compra.service';
import { CompraRepositoryInterface } from '../repositories/interfaces/compra.repository.interface';
import { ProductoRepositoryInterface } from '../../producto/repositories/interfaces/producto-interface.repository';
import { IUserRepository } from '../../users/interfaces/users.repository.interface';
import { ProveedorRepositoryInterface } from '../../proveedor/repositories/interfaces/proveedor.repository.interface';
import { ProductoProveedorServiceInterface } from '../../proveedor/services/interfaces/producto-proveedor.service.interface';
import { IAuditoriaService } from '../../auditoria/interfaces/auditoria.service.interface';
import {
  COMPRA_REPOSITORY,
  PRODUCTO_REPOSITORY,
  USUARIO_REPOSITORY,
  PROVEEDOR_REPOSITORY,
  PRODUCTO_PROVEEDOR_SERVICE,
} from '../../constants';
import { CreateCompraDto } from '../dto/create-compra.dto';
import { MetodoPagoCompraEnum } from '../helpers/metodo-pago-compra.enum';
import { Compra } from '../entities/compra.entity';
import { UserRole } from '../../users/helpers/enum.roles';

describe('CompraService', () => {
  let service: CompraService;
  let compraRepository: jest.Mocked<CompraRepositoryInterface>;
  let productoRepository: jest.Mocked<ProductoRepositoryInterface>;
  let usuarioRepository: jest.Mocked<IUserRepository>;
  let proveedorRepository: jest.Mocked<ProveedorRepositoryInterface>;
  let productoProveedorService: jest.Mocked<ProductoProveedorServiceInterface>;
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

  const mockProveedor = {
    idProveedor: 1,
    nombre: 'Proveedor Test',
    contacto: 'test@prov.com',
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
    compraRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByUsuario: jest.fn(),
      save: jest.fn(),
      updateCompra: jest.fn(),
      getQueryRunner: jest.fn(),
      removeDetallesInTransaction: jest.fn(),
    } as any;

    productoRepository = {
      findOneActive: jest.fn(),
      updateStock: jest.fn(),
    } as any;

    usuarioRepository = {
      findById: jest.fn(),
    } as any;

    proveedorRepository = {
      findOne: jest.fn(),
      findOneActive: jest.fn(),
    } as any;

    productoProveedorService = {
      checkLinkExists: jest.fn(),
    } as any;

    auditoriaService = {
      registrarEvento: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompraService,
        { provide: COMPRA_REPOSITORY, useValue: compraRepository },
        { provide: PRODUCTO_REPOSITORY, useValue: productoRepository },
        { provide: USUARIO_REPOSITORY, useValue: usuarioRepository },
        { provide: PROVEEDOR_REPOSITORY, useValue: proveedorRepository },
        { provide: PRODUCTO_PROVEEDOR_SERVICE, useValue: productoProveedorService },
        { provide: 'IAuditoriaService', useValue: auditoriaService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<CompraService>(CompraService);
  });

  describe('create', () => {
    const createCompraDto: CreateCompraDto = {
      metodoPago: MetodoPagoCompraEnum.EFECTIVO,
      idProveedor: 1,
      detalles: [{ idProducto: 1, cantidad: 10 }],
    };

    it('debería crear una compra exitosamente', async () => {
      const mockCompra = { idCompra: 1, total: 1000 } as Compra;

      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      proveedorRepository.findOne.mockResolvedValue(mockProveedor as any);
      productoProveedorService.checkLinkExists.mockResolvedValue(true);
      productoRepository.findOneActive.mockResolvedValue(mockProducto as any);
      mockQueryRunner.manager.save.mockResolvedValue(mockCompra);
      compraRepository.findOne.mockResolvedValue(mockCompra);

      const result = await service.create(createCompraDto, mockUsuario.id);

      expect(result).toBeDefined();
      expect(usuarioRepository.findById).toHaveBeenCalledWith(mockUsuario.id);
      expect(proveedorRepository.findOne).toHaveBeenCalledWith(createCompraDto.idProveedor);
      expect(productoProveedorService.checkLinkExists).toHaveBeenCalledWith(1, 1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(auditoriaService.registrarEvento).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      usuarioRepository.findById.mockResolvedValue(null);

      await expect(service.create(createCompraDto, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar NotFoundException si el proveedor no existe', async () => {
      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      proveedorRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createCompraDto, mockUsuario.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar BadRequestException si producto no está asociado al proveedor', async () => {
      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      proveedorRepository.findOne.mockResolvedValue(mockProveedor as any);
      productoProveedorService.checkLinkExists.mockResolvedValue(false);
      productoRepository.findOneActive.mockResolvedValue(mockProducto as any);

      await expect(service.create(createCompraDto, mockUsuario.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debería lanzar NotFoundException si el producto no existe', async () => {
      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      proveedorRepository.findOne.mockResolvedValue(mockProveedor as any);
      productoProveedorService.checkLinkExists.mockResolvedValue(true);
      productoRepository.findOneActive.mockResolvedValue(null);

      await expect(service.create(createCompraDto, mockUsuario.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería calcular el total correctamente con múltiples productos', async () => {
      const multiProductDto: CreateCompraDto = {
        metodoPago: MetodoPagoCompraEnum.EFECTIVO,
        idProveedor: 1,
        detalles: [
          { idProducto: 1, cantidad: 10 },
          { idProducto: 2, cantidad: 5 },
        ],
      };

      const mockProducto2 = { idProducto: 2, nombre: 'Producto 2', precio: 200, stock: 20 };

      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      proveedorRepository.findOne.mockResolvedValue(mockProveedor as any);
      productoProveedorService.checkLinkExists.mockResolvedValue(true);
      productoRepository.findOneActive
        .mockResolvedValueOnce(mockProducto as any)
        .mockResolvedValueOnce(mockProducto2 as any);

      const mockCompra = { idCompra: 1, total: 2000 } as Compra;
      mockQueryRunner.manager.save.mockResolvedValue(mockCompra);
      compraRepository.findOne.mockResolvedValue(mockCompra);

      await service.create(multiProductDto, mockUsuario.id);

      expect(productoRepository.updateStock).toHaveBeenCalledWith(1, 10);
      expect(productoRepository.updateStock).toHaveBeenCalledWith(2, 5);
    });

    it('debería hacer rollback si ocurre error al guardar', async () => {
      usuarioRepository.findById.mockResolvedValue(mockUsuario as any);
      proveedorRepository.findOne.mockResolvedValue(mockProveedor as any);
      productoProveedorService.checkLinkExists.mockResolvedValue(true);
      productoRepository.findOneActive.mockResolvedValue(mockProducto as any);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(createCompraDto, mockUsuario.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las compras', async () => {
      const mockCompras = [{ idCompra: 1 }, { idCompra: 2 }] as Compra[];
      compraRepository.findAll.mockResolvedValue(mockCompras);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(compraRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar una compra por ID', async () => {
      const mockCompra = { idCompra: 1 } as Compra;
      compraRepository.findOne.mockResolvedValue(mockCompra);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(compraRepository.findOne).toHaveBeenCalledWith(1);
    });

    it('debería lanzar NotFoundException si la compra no existe', async () => {
      compraRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUsuario', () => {
    it('debería retornar compras de un usuario específico', async () => {
      const mockCompras = [{ idCompra: 1 }] as Compra[];
      compraRepository.findByUsuario.mockResolvedValue(mockCompras);

      const result = await service.findByUsuario(1);

      expect(result).toBeDefined();
      expect(compraRepository.findByUsuario).toHaveBeenCalledWith(1);
    });
  });
});
