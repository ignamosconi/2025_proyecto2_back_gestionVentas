import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { ProveedorRepositoryInterface } from '../repositories/interfaces/proveedor.repository.interface';
import { PROVEEDOR_REPOSITORY } from '../../constants';
import { Proveedor } from '../entities/proveedor.entity';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';

describe('ProveedorService', () => {
  let service: ProveedorService;
  let mockRepository: jest.Mocked<ProveedorRepositoryInterface>;

  const proveedorMock: Proveedor = {
    idProveedor: 1,
    nombre: 'Proveedor Test',
    direccion: 'Calle Test 123',
    telefono: '123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    productos: [],
  };

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findAllSoftDeleted: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProveedorService,
        { provide: PROVEEDOR_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ProveedorService>(ProveedorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    // CASO 1: Retorna todos los proveedores
    it('debería retornar todos los proveedores', async () => {
      const proveedores = [proveedorMock];
      mockRepository.findAll.mockResolvedValue(proveedores);

      const result = await service.findAll();

      expect(result).toEqual(proveedores);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    // CASO 2: Retorna proveedor existente
    it('debería retornar proveedor cuando existe', async () => {
      mockRepository.findOne.mockResolvedValue(proveedorMock);

      const result = await service.findOne(1);

      expect(result).toEqual(proveedorMock);
      expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    });

    // CASO 3: Lanza excepción cuando proveedor no existe
    it('debería lanzar NotFoundException cuando proveedor no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Proveedor 999 no encontrado',
      );
    });
  });

  describe('findOneActive', () => {
    // CASO 4: Retorna proveedor activo
    it('debería retornar proveedor cuando está activo', async () => {
      mockRepository.findOne.mockResolvedValue(proveedorMock);

      const result = await service.findOneActive(1);

      expect(result).toEqual(proveedorMock);
    });

    // CASO 5: Lanza excepción cuando proveedor está eliminado
    it('debería lanzar NotFoundException cuando proveedor está eliminado', async () => {
      const proveedorEliminado = {
        ...proveedorMock,
        deletedAt: new Date(),
      };
      mockRepository.findOne.mockResolvedValue(proveedorEliminado);

      await expect(service.findOneActive(1)).rejects.toThrow(NotFoundException);
      await expect(service.findOneActive(1)).rejects.toThrow(
        'Proveedor con id 1 no encontrado o eliminado',
      );
    });
  });

  describe('create', () => {
    // CASO 6: Creación exitosa
    it('debería crear proveedor exitosamente', async () => {
      const createDto: CreateProveedorDto = {
        nombre: 'Nuevo Proveedor',
        direccion: 'Calle Nueva 456',
        telefono: '987654321',
      };

      mockRepository.create.mockResolvedValue({
        ...proveedorMock,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result.nombre).toBe(createDto.nombre);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    const updateDto: UpdateProveedorDto = {
      telefono: '111222333',
    };

    // CASO 7: Actualización exitosa
    it('debería actualizar proveedor existente', async () => {
      mockRepository.findOne.mockResolvedValue(proveedorMock);
      mockRepository.update.mockResolvedValue({
        ...proveedorMock,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result.telefono).toBe(updateDto.telefono);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateDto);
    });

    // CASO 8: Falla cuando proveedor no existe
    it('debería lanzar NotFoundException cuando proveedor no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete - Transición de Estados', () => {
    // CASO 9: Eliminación exitosa de proveedor activo
    it('debería eliminar proveedor activo exitosamente', async () => {
      mockRepository.findOne.mockResolvedValue(proveedorMock);
      mockRepository.softDelete.mockResolvedValue(undefined);

      await expect(service.softDelete(1)).resolves.not.toThrow();

      expect(mockRepository.findOne).toHaveBeenCalledWith(1);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
    });

    // CASO 10: Falla al eliminar proveedor inexistente
    it('debería lanzar NotFoundException al eliminar proveedor inexistente', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete(999)).rejects.toThrow(NotFoundException);
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    // CASO 11: Restauración de proveedor eliminado
    it('debería restaurar proveedor eliminado', async () => {
      mockRepository.restore.mockResolvedValue(undefined);

      await expect(service.restore(1)).resolves.not.toThrow();

      expect(mockRepository.restore).toHaveBeenCalledWith(1);
    });
  });

  describe('findAllSoftDeleted', () => {
    // CASO 12: Retorna proveedores eliminados
    it('debería retornar proveedores eliminados', async () => {
      const proveedoresEliminados = [
        { ...proveedorMock, deletedAt: new Date() },
      ];
      mockRepository.findAllSoftDeleted.mockResolvedValue(
        proveedoresEliminados,
      );

      const result = await service.findAllSoftDeleted();

      expect(result).toEqual(proveedoresEliminados);
      expect(mockRepository.findAllSoftDeleted).toHaveBeenCalledTimes(1);
    });
  });
});
