import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarcaRepository } from './marca.repository';
import { Marca } from '../entities/marca.entity';
import { MarcaLinea } from '../entities/marca-linea.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateMarcaDto } from '../dto/create-marca.dto';
import { UpdateMarcaDto } from '../dto/update-marca.dto';

describe('MarcaRepository', () => {
  let repository: MarcaRepository;
  let mockMarcaOrmRepo: jest.Mocked<Repository<Marca>>;
  let mockBrandLineOrmRepo: jest.Mocked<Repository<MarcaLinea>>;

  const marcaMock: Marca = {
    id: 1,
    nombre: 'Nike',
    descripcion: 'Marca deportiva',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    marcaLineas: [],
    productos: [],
  };

  beforeEach(async () => {
    mockMarcaOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockBrandLineOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcaRepository,
        { provide: getRepositoryToken(Marca), useValue: mockMarcaOrmRepo },
        { provide: getRepositoryToken(MarcaLinea), useValue: mockBrandLineOrmRepo },
      ],
    }).compile();

    repository = module.get<MarcaRepository>(MarcaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByName - Partición de Equivalencia', () => {
    it('debería retornar marca cuando existe', async () => {
      mockMarcaOrmRepo.findOneBy.mockResolvedValue(marcaMock);

      const result = await repository.findByName('Nike');

      expect(result).toEqual(marcaMock);
      expect(mockMarcaOrmRepo.findOneBy).toHaveBeenCalledWith({ nombre: 'Nike' });
    });

    it('debería retornar null cuando no existe', async () => {
      mockMarcaOrmRepo.findOneBy.mockResolvedValue(null);

      const result = await repository.findByName('Inexistente');

      expect(result).toBeNull();
    });
  });

  describe('create - Partición de Equivalencia (nombre único)', () => {
    const createDto: CreateMarcaDto = {
      nombre: 'Adidas',
      descripcion: 'Marca deportiva',
    };

    it('debería crear marca con nombre único', async () => {
      mockMarcaOrmRepo.create.mockReturnValue(marcaMock as any);
      mockMarcaOrmRepo.save.mockResolvedValue(marcaMock);

      const result = await repository.create(createDto);

      expect(result).toEqual(marcaMock);
      expect(mockMarcaOrmRepo.save).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException con nombre duplicado', async () => {
      mockMarcaOrmRepo.create.mockReturnValue(marcaMock as any);
      mockMarcaOrmRepo.save.mockRejectedValue({ code: '23505' });

      await expect(repository.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(repository.create(createDto)).rejects.toThrow('El nombre de la marca ya existe');
    });
  });

  describe('update - Valores Límite', () => {
    const updateDto: UpdateMarcaDto = { descripcion: 'Nueva descripción' };

    it('debería actualizar marca existente', async () => {
      mockMarcaOrmRepo.findOneBy.mockResolvedValue(marcaMock);
      mockMarcaOrmRepo.save.mockResolvedValue({ ...marcaMock, ...updateDto } as Marca);

      const result = await repository.update(1, updateDto);

      expect(result.descripcion).toBe(updateDto.descripcion);
    });

    it('debería lanzar NotFoundException con ID inexistente', async () => {
      mockMarcaOrmRepo.findOneBy.mockResolvedValue(null);

      await expect(repository.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete - Valores Límite (affected)', () => {
    it('debería eliminar marca cuando affected = 1', async () => {
      mockMarcaOrmRepo.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repository.softDelete(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando affected = 0', async () => {
      mockMarcaOrmRepo.softDelete.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      await expect(repository.softDelete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore - Valores Límite (affected)', () => {
    it('debería restaurar marca cuando affected = 1', async () => {
      mockMarcaOrmRepo.restore.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repository.restore(1)).resolves.not.toThrow();
    });

    it('debería lanzar NotFoundException cuando affected = 0', async () => {
      mockMarcaOrmRepo.restore.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      await expect(repository.restore(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneWithProducts', () => {
    it('debería retornar marca con relación productos', async () => {
      mockMarcaOrmRepo.findOne.mockResolvedValue(marcaMock);

      const result = await repository.findOneWithProducts(1);

      expect(result).toEqual(marcaMock);
      expect(mockMarcaOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['productos'],
      });
    });
  });
});
