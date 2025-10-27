import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { LineaRepository } from './linea.repository';
import { Linea } from '../entities/linea.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateLineaDto } from '../dto/create-linea.dto';
import { UpdateLineaDto } from '../dto/update-linea.dto';

describe('LineaRepository', () => {
  let repository: LineaRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<Linea>>;

  const lineaMock: Linea = {
    id: 1,
    nombre: 'Calzado',
    descripcion: 'Línea de calzado',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    marcaLineas: [],
    productos: [],
  };

  beforeEach(async () => {
    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as any;

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineaRepository,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<LineaRepository>(LineaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear línea exitosamente', async () => {
      const createDto: CreateLineaDto = { nombre: 'Calzado', descripcion: 'Línea de calzado' };
      mockTypeOrmRepo.create.mockReturnValue(lineaMock as any);
      mockTypeOrmRepo.save.mockResolvedValue(lineaMock);

      const result = await repository.create(createDto);

      expect(result).toEqual(lineaMock);
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
    });
  });

  describe('update - Valores Límite', () => {
    const updateDto: UpdateLineaDto = { descripcion: 'Nueva descripción' };

    it('debería actualizar línea existente', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeOrmRepo.findOne.mockResolvedValue({ ...lineaMock, ...updateDto } as Linea);

      const result = await repository.update(1, updateDto);

      expect(result.descripcion).toBe(updateDto.descripcion);
    });

    it('debería lanzar NotFoundException cuando línea no existe', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      await expect(repository.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete - Valores Límite (affected)', () => {
    it('debería eliminar cuando affected = 1', async () => {
      mockTypeOrmRepo.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repository.softDelete(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando affected = 0', async () => {
      mockTypeOrmRepo.softDelete.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      await expect(repository.softDelete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore - Valores Límite (affected)', () => {
    it('debería restaurar cuando affected = 1', async () => {
      mockTypeOrmRepo.restore.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repository.restore(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando affected = 0', async () => {
      mockTypeOrmRepo.restore.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      await expect(repository.restore(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName - Partición de Equivalencia', () => {
    it('debería retornar línea cuando existe', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(lineaMock);

      const result = await repository.findByName('Calzado');

      expect(result).toEqual(lineaMock);
    });

    it('debería retornar null cuando no existe', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByName('Inexistente');

      expect(result).toBeNull();
    });
  });

  describe('findOneActive', () => {
    it('debería retornar línea activa', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(lineaMock);

      const result = await repository.findOneActive(1);

      expect(result).toEqual(lineaMock);
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
