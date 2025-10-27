import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { MarcaLineaRepository } from './marca-linea.repository';
import { MarcaLinea } from '../entities/marca-linea.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateMarcaLineaDto } from '../dto/create-marca-linea.dto';

describe('MarcaLineaRepository', () => {
  let repository: MarcaLineaRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<MarcaLinea>>;

  const marcaLineaMock: MarcaLinea = {
    marcaId: 1,
    lineaId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    marca: null as any,
    linea: null as any,
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    } as unknown as SelectQueryBuilder<MarcaLinea>;

    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcaLineaRepository,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<MarcaLineaRepository>(MarcaLineaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Tabla de Decisión (Marca × Línea)', () => {
    const createDto: CreateMarcaLineaDto = { marcaId: 1, lineaId: 1 };

    it('debería crear asociación válida marca-línea', async () => {
      mockTypeOrmRepo.create.mockReturnValue(marcaLineaMock as any);
      mockTypeOrmRepo.save.mockResolvedValue(marcaLineaMock);

      const result = await repository.create(createDto);

      expect(result).toEqual(marcaLineaMock);
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
    });
  });

  describe('softDelete - Valores Límite', () => {
    it('debería eliminar asociación existente', async () => {
      mockTypeOrmRepo.findOneBy.mockResolvedValue(marcaLineaMock);
      mockTypeOrmRepo.softRemove.mockResolvedValue(marcaLineaMock);

      await expect(repository.softDelete(1, 1)).resolves.not.toThrow();
      expect(mockTypeOrmRepo.softRemove).toHaveBeenCalledWith(marcaLineaMock);
    });

    it('debería lanzar NotFoundException si asociación no existe', async () => {
      mockTypeOrmRepo.findOneBy.mockResolvedValue(null);

      await expect(repository.softDelete(1, 999)).rejects.toThrow(NotFoundException);
      await expect(repository.softDelete(1, 999)).rejects.toThrow(
        'Vínculo Marca ID 1 - Línea ID 999 no encontrado'
      );
    });
  });

  describe('findAllByMarcaId - Partición de Equivalencia', () => {
    it('debería retornar líneas asociadas a una marca', async () => {
      const vinculos = [marcaLineaMock];
      mockTypeOrmRepo.find.mockResolvedValue(vinculos);

      const result = await repository.findAllByMarcaId(1);

      expect(result).toEqual(vinculos);
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { marcaId: 1 },
        relations: ['linea'],
      });
    });

    it('debería retornar array vacío si marca no tiene líneas', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);

      const result = await repository.findAllByMarcaId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findLineaByNameForMarca', () => {
    it('debería encontrar línea por nombre para marca específica', async () => {
      const mockQueryBuilder = mockTypeOrmRepo.createQueryBuilder() as any;
      mockQueryBuilder.getOne.mockResolvedValue(marcaLineaMock);

      const result = await repository.findLineaByNameForMarca(1, 'Zapatillas');

      expect(result).toEqual(marcaLineaMock);
    });

    it('debería retornar null si no existe la combinación', async () => {
      const mockQueryBuilder = mockTypeOrmRepo.createQueryBuilder() as any;
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findLineaByNameForMarca(1, 'Inexistente');

      expect(result).toBeNull();
    });
  });
});
