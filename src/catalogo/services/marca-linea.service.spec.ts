import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MarcaLineaService } from './marca-linea.service';
import { MarcaLineaRepositoryInterface } from '../repositories/interfaces/marca-linea.repository.interface';
import { MarcaServiceInterface } from './interfaces/marca.service.interface';
import { LineaServiceInterface } from './interfaces/linea.service.interface';
import {
  MARCA_LINEA_REPOSITORY,
  MARCA_SERVICE,
  LINEA_SERVICE,
} from '../../constants';
import { MarcaLinea } from '../entities/marca-linea.entity';
import { CreateMarcaLineaDto } from '../dto/create-marca-linea.dto';

describe('MarcaLineaService', () => {
  let service: MarcaLineaService;
  let mockRepository: jest.Mocked<MarcaLineaRepositoryInterface>;
  let mockMarcaService: jest.Mocked<MarcaServiceInterface>;
  let mockLineaService: jest.Mocked<LineaServiceInterface>;

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
    mockRepository = {
      findAllActive: jest.fn(),
      findAllDeleted: jest.fn(),
      findAllByMarcaId: jest.fn(),
      create: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    mockMarcaService = {
      findOneActive: jest.fn(),
      findAll: jest.fn(),
      findAllDeleted: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as any;

    mockLineaService = {
      findOneActive: jest.fn(),
      findAll: jest.fn(),
      findAllSoftDeleted: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcaLineaService,
        { provide: MARCA_LINEA_REPOSITORY, useValue: mockRepository },
        { provide: MARCA_SERVICE, useValue: mockMarcaService },
        { provide: LINEA_SERVICE, useValue: mockLineaService },
      ],
    }).compile();

    service = module.get<MarcaLineaService>(MarcaLineaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignLineaToMarca - Tabla de Decisión', () => {
    const createDto: CreateMarcaLineaDto = {
      marcaId: 1,
      lineaId: 1,
    };

    // CASO 1: Asignación exitosa (marca existe, línea existe, vínculo no existe)
    it('debería asignar línea a marca cuando ambos existen y no hay vínculo previo', async () => {
      mockMarcaService.findOneActive.mockResolvedValue({} as any);
      mockLineaService.findOneActive.mockResolvedValue({} as any);
      mockRepository.findAllByMarcaId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(marcaLineaMock);

      const result = await service.assignLineaToMarca(createDto);

      expect(result).toEqual(marcaLineaMock);
      expect(mockMarcaService.findOneActive).toHaveBeenCalledWith(1);
      expect(mockLineaService.findOneActive).toHaveBeenCalledWith(1);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    // CASO 2: Falla cuando marca no existe
    it('debería lanzar NotFoundException cuando marca no existe', async () => {
      mockMarcaService.findOneActive.mockRejectedValue(
        new NotFoundException('Marca con ID 1 no encontrada'),
      );

      await expect(service.assignLineaToMarca(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    // CASO 3: Falla cuando línea no existe
    it('debería lanzar NotFoundException cuando línea no existe', async () => {
      mockMarcaService.findOneActive.mockResolvedValue({} as any);
      mockLineaService.findOneActive.mockRejectedValue(
        new NotFoundException('Línea con ID 1 no encontrada'),
      );

      await expect(service.assignLineaToMarca(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    // CASO 4: Falla cuando vínculo ya existe (partición inválida)
    it('debería lanzar ConflictException cuando vínculo ya existe', async () => {
      mockMarcaService.findOneActive.mockResolvedValue({} as any);
      mockLineaService.findOneActive.mockResolvedValue({} as any);
      mockRepository.findAllByMarcaId.mockResolvedValue([marcaLineaMock]);

      await expect(service.assignLineaToMarca(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.assignLineaToMarca(createDto)).rejects.toThrow(
        'El vínculo Marca ID 1 - Línea ID 1 ya existe.',
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('unassignLineaFromMarca', () => {
    // CASO 5: Desvinculación exitosa
    it('debería desvincular línea de marca exitosamente', async () => {
      mockRepository.softDelete.mockResolvedValue(undefined);

      await expect(service.unassignLineaFromMarca(1, 1)).resolves.not.toThrow();

      expect(mockRepository.softDelete).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('findAll', () => {
    // CASO 6: Retorna todos los vínculos activos
    it('debería retornar todos los vínculos activos', async () => {
      const vinculos = [marcaLineaMock];
      mockRepository.findAllActive.mockResolvedValue(vinculos);

      const result = await service.findAll();

      expect(result).toEqual(vinculos);
      expect(mockRepository.findAllActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllDeleted', () => {
    // CASO 7: Retorna vínculos eliminados
    it('debería retornar vínculos eliminados', async () => {
      const vinculosEliminados = [{ ...marcaLineaMock, deletedAt: new Date() }];
      mockRepository.findAllDeleted.mockResolvedValue(vinculosEliminados);

      const result = await service.findAllDeleted();

      expect(result).toEqual(vinculosEliminados);
      expect(mockRepository.findAllDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllByMarcaId', () => {
    // CASO 8: Retorna vínculos de una marca existente
    it('debería retornar vínculos de una marca cuando existe', async () => {
      mockMarcaService.findOneActive.mockResolvedValue({} as any);
      const vinculos = [marcaLineaMock];
      mockRepository.findAllByMarcaId.mockResolvedValue(vinculos);

      const result = await service.findAllByMarcaId(1);

      expect(result).toEqual(vinculos);
      expect(mockMarcaService.findOneActive).toHaveBeenCalledWith(1);
      expect(mockRepository.findAllByMarcaId).toHaveBeenCalledWith(1);
    });

    // CASO 9: Falla cuando marca no existe
    it('debería lanzar NotFoundException cuando marca no existe', async () => {
      mockMarcaService.findOneActive.mockRejectedValue(
        new NotFoundException('Marca no encontrada'),
      );

      await expect(service.findAllByMarcaId(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findAllByMarcaId).not.toHaveBeenCalled();
    });
  });
});
