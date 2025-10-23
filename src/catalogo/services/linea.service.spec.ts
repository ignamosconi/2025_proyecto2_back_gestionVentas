import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LineaService } from './linea.service';
import { LineaRepositoryInterface } from '../repositories/interfaces/linea.repository.interface';
import { LINEA_REPOSITORY } from '../../constants';
import { Linea } from '../entities/linea.entity';
import { CreateLineaDto } from '../dto/create-linea.dto';
import { UpdateLineaDto } from '../dto/update-linea.dto';

describe('LineaService', () => {
  let service: LineaService;
  let mockRepository: jest.Mocked<LineaRepositoryInterface>;

  const lineaMock: Linea = {
    id: 1,
    nombre: 'Sedán',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    marcaLineas: [],
    productos: [],
  };

  beforeEach(async () => {
    mockRepository = {
      findAllActive: jest.fn(),
      findAllSoftDeleted: jest.fn(),
      findOneActive: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineaService,
        { provide: LINEA_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<LineaService>(LineaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    // CASO 1: Retorna todas las líneas activas
    it('debería retornar todas las líneas activas', async () => {
      const lineas = [lineaMock];
      mockRepository.findAllActive.mockResolvedValue(lineas);

      const result = await service.findAll();

      expect(result).toEqual(lineas);
      expect(mockRepository.findAllActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOneActive', () => {
    // CASO 2: Retorna línea existente
    it('debería retornar línea cuando existe', async () => {
      mockRepository.findOneActive.mockResolvedValue(lineaMock);

      const result = await service.findOneActive(1);

      expect(result).toEqual(lineaMock);
      expect(mockRepository.findOneActive).toHaveBeenCalledWith(1);
    });

    // CASO 3: Lanza excepción cuando línea no existe
    it('debería lanzar NotFoundException cuando línea no existe', async () => {
      mockRepository.findOneActive.mockResolvedValue(null);

      await expect(service.findOneActive(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneActive(999)).rejects.toThrow(
        'Línea con ID 999 no encontrada o está eliminada.',
      );
    });
  });

  describe('create - Partición de Equivalencia', () => {
    const createDto: CreateLineaDto = {
      nombre: 'SUV',
    };

    // CASO 4: Creación exitosa (partición válida - nombre único)
    it('debería crear línea cuando nombre es único', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ ...lineaMock, ...createDto });

      const result = await service.create(createDto);

      expect(result.nombre).toBe(createDto.nombre);
      expect(mockRepository.findByName).toHaveBeenCalledWith(createDto.nombre);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    // CASO 5: Falla por nombre duplicado (partición inválida)
    it('debería lanzar BadRequestException cuando nombre ya existe', async () => {
      mockRepository.findByName.mockResolvedValue(lineaMock);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow(
        `El nombre de línea '${createDto.nombre}' ya existe en el sistema.`,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update - Tabla de Decisión', () => {
    const updateDto: UpdateLineaDto = {
      nombre: 'SUV Premium',
    };

    // CASO 6: Actualización sin cambiar nombre
    it('debería actualizar cuando no se cambia el nombre', async () => {
      const dtoSinNombre: UpdateLineaDto = {};
      mockRepository.update.mockResolvedValue(lineaMock);

      const result = await service.update(1, dtoSinNombre);

      expect(mockRepository.findByName).not.toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(1, dtoSinNombre);
    });

    // CASO 7: Actualización con nombre único (mismo ID)
    it('debería actualizar cuando nombre pertenece a la misma línea', async () => {
      mockRepository.findByName.mockResolvedValue(lineaMock);
      mockRepository.update.mockResolvedValue({ ...lineaMock, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(1, updateDto);
    });

    // CASO 8: Actualización con nombre de otra línea (conflicto)
    it('debería lanzar BadRequestException cuando nombre pertenece a otra línea', async () => {
      const otraLinea = { ...lineaMock, id: 2 };
      mockRepository.findByName.mockResolvedValue(otraLinea);

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow(
        `El nombre de línea '${updateDto.nombre}' ya está siendo usado por otra línea.`,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete - Transición de Estados', () => {
    // CASO 9: Eliminación exitosa de línea activa
    it('debería eliminar línea activa exitosamente', async () => {
      mockRepository.findOneActive.mockResolvedValue(lineaMock);
      mockRepository.softDelete.mockResolvedValue(undefined);

      await expect(service.softDelete(1)).resolves.not.toThrow();

      expect(mockRepository.findOneActive).toHaveBeenCalledWith(1);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
    });

    // CASO 10: Falla al eliminar línea inexistente
    it('debería lanzar NotFoundException al eliminar línea inexistente', async () => {
      mockRepository.findOneActive.mockResolvedValue(null);

      await expect(service.softDelete(999)).rejects.toThrow(NotFoundException);
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    // CASO 11: Restauración de línea eliminada
    it('debería restaurar línea eliminada', async () => {
      mockRepository.restore.mockResolvedValue(undefined);

      await expect(service.restore(1)).resolves.not.toThrow();

      expect(mockRepository.restore).toHaveBeenCalledWith(1);
    });
  });

  describe('findAllSoftDeleted', () => {
    // CASO 12: Retorna líneas eliminadas
    it('debería retornar líneas eliminadas', async () => {
      const lineasEliminadas = [{ ...lineaMock, deletedAt: new Date() }];
      mockRepository.findAllSoftDeleted.mockResolvedValue(lineasEliminadas);

      const result = await service.findAllSoftDeleted();

      expect(result).toEqual(lineasEliminadas);
      expect(mockRepository.findAllSoftDeleted).toHaveBeenCalledTimes(1);
    });
  });
});
