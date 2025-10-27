import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { ProveedorRepository } from './proveedor.repository';
import { Proveedor } from '../entities/proveedor.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';

describe('ProveedorRepository', () => {
  let repository: ProveedorRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<Proveedor>>;

  const proveedorMock: Proveedor = {
    idProveedor: 1,
    nombre: 'Proveedor Test',
    contacto: 'Juan Perez',
    telefono: '+54 11 1234-5678',
    email: 'proveedor@test.com',
    direccion: 'Calle Falsa 123',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    productos: [],
  };

  beforeEach(async () => {
    mockTypeOrmRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as any;

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProveedorRepository,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<ProveedorRepository>(ProveedorRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Partición de Equivalencia', () => {
    it('debería crear proveedor exitosamente', async () => {
      const createDto: CreateProveedorDto = {
        nombre: 'Proveedor Test',
        contacto: 'Juan Perez',
        telefono: '+54 11 1234-5678',
        email: 'proveedor@test.com',
        direccion: 'Calle Falsa 123',
      };

      mockTypeOrmRepo.create.mockReturnValue(proveedorMock as any);
      mockTypeOrmRepo.save.mockResolvedValue(proveedorMock);

      const result = await repository.create(createDto);

      expect(result).toEqual(proveedorMock);
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
    });
  });

  describe('findOne - Partición de Equivalencia', () => {
    it('debería retornar proveedor cuando existe', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(proveedorMock);

      const result = await repository.findOne(1);

      expect(result).toEqual(proveedorMock);
    });

    it('debería lanzar NotFoundException cuando no existe', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      await expect(repository.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(repository.findOne(999)).rejects.toThrow('Proveedor con id 999 no encontrado');
    });
  });

  describe('update - Partición de Equivalencia', () => {
    const updateDto: UpdateProveedorDto = { telefono: '+54 11 9999-9999' };

    it('debería actualizar proveedor existente', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(proveedorMock);
      mockTypeOrmRepo.merge.mockReturnValue({ ...proveedorMock, ...updateDto } as Proveedor);
      mockTypeOrmRepo.save.mockResolvedValue({ ...proveedorMock, ...updateDto } as Proveedor);

      const result = await repository.update(1, updateDto);

      expect(result.telefono).toBe(updateDto.telefono);
    });

    it('debería lanzar NotFoundException cuando proveedor no existe', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      await expect(repository.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete - Valores Límite', () => {
    it('debería eliminar proveedor existente', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(proveedorMock);
      mockTypeOrmRepo.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repository.softDelete(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando proveedor no existe', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      await expect(repository.softDelete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore - Valores Límite', () => {
    it('debería restaurar proveedor eliminado', async () => {
      const proveedorEliminado = { ...proveedorMock, deletedAt: new Date() };
      mockTypeOrmRepo.findOne.mockResolvedValue(proveedorEliminado);
      mockTypeOrmRepo.restore.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repository.restore(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando proveedor no existe', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      await expect(repository.restore(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('debería retornar solo proveedores activos', async () => {
      const proveedores = [proveedorMock];
      mockTypeOrmRepo.find.mockResolvedValue(proveedores);

      const result = await repository.findAll();

      expect(result).toEqual(proveedores);
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({ where: { deletedAt: expect.anything() } });
    });
  });
});
