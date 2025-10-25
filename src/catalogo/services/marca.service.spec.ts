import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MarcaService } from './marca.service';
import { MarcaRepositoryInterface } from '../repositories/interfaces/marca.repository.interface';
import { MARCA_REPOSITORY, MARCA_LINEA_REPOSITORY, PRODUCTO_REPOSITORY } from '../../constants';
import { Marca } from '../entities/marca.entity';
import { CreateMarcaDto } from '../dto/create-marca.dto';
import { UpdateMarcaDto } from '../dto/update-marca.dto';

describe('MarcaService', () => {
  let service: MarcaService;
  let mockRepository: jest.Mocked<MarcaRepositoryInterface>;
  let mockMarcaLineaRepository: any;
  let mockProductoRepository: any;

  const marcaMock: Marca = {
    id: 1,
    nombre: 'Toyota',
    descripcion: 'Marca japonesa',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    marcaLineas: [],
    productos: [],
  };

  beforeEach(async () => {
    mockRepository = {
      findAllActive: jest.fn(),
      findAllDeleted: jest.fn(),
      findOneActive: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as any;

    mockMarcaLineaRepository = {
      findAllByMarcaId: jest.fn(),
      softDeleteAllByMarcaId: jest.fn(),
    };

    mockProductoRepository = {
      findByMarca: jest.fn(),
      hasProductsByMarcaId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcaService,
        { provide: MARCA_REPOSITORY, useValue: mockRepository },
        { provide: MARCA_LINEA_REPOSITORY, useValue: mockMarcaLineaRepository },
        { provide: PRODUCTO_REPOSITORY, useValue: mockProductoRepository },
      ],
    }).compile();

    service = module.get<MarcaService>(MarcaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    // CASO 1: Retorna todas las marcas activas
    it('debería retornar todas las marcas activas', async () => {
      const marcas = [marcaMock];
      mockRepository.findAllActive.mockResolvedValue(marcas);

      const result = await service.findAll();

      expect(result).toEqual(marcas);
      expect(mockRepository.findAllActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOneActive', () => {
    // CASO 2: Retorna marca existente
    it('debería retornar marca cuando existe', async () => {
      mockRepository.findOneActive.mockResolvedValue(marcaMock);

      const result = await service.findOneActive(1);

      expect(result).toEqual(marcaMock);
      expect(mockRepository.findOneActive).toHaveBeenCalledWith(1);
    });

    // CASO 3: Lanza excepción cuando marca no existe
    it('debería lanzar NotFoundException cuando marca no existe', async () => {
      mockRepository.findOneActive.mockResolvedValue(null);

      await expect(service.findOneActive(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneActive(999)).rejects.toThrow(
        'Marca con ID 999 no encontrada o está eliminada.',
      );
    });
  });

  describe('create - Partición de Equivalencia', () => {
    const createDto: CreateMarcaDto = {
      nombre: 'Honda',
      descripcion: 'Marca japonesa',
    };

    // CASO 4: Creación exitosa (partición válida - nombre único)
    it('debería crear marca cuando nombre es único', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ ...marcaMock, ...createDto });

      const result = await service.create(createDto);

      expect(result.nombre).toBe(createDto.nombre);
      expect(mockRepository.findByName).toHaveBeenCalledWith(createDto.nombre);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    // CASO 5: Falla por nombre duplicado (partición inválida)
    it('debería lanzar BadRequestException cuando nombre ya existe', async () => {
      mockRepository.findByName.mockResolvedValue(marcaMock);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow(
        `El nombre de marca '${createDto.nombre}' ya existe en el sistema.`,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update - Tabla de Decisión', () => {
    const updateDto: UpdateMarcaDto = {
      nombre: 'Honda Actualizada',
    };

    // CASO 6: Actualización sin cambiar nombre (nombre undefined)
    it('debería actualizar cuando no se cambia el nombre', async () => {
      const dtoSinNombre: UpdateMarcaDto = { descripcion: 'Nueva descripción' };
      mockRepository.update.mockResolvedValue({ ...marcaMock, ...dtoSinNombre });

      const result = await service.update(1, dtoSinNombre);

      expect(mockRepository.findByName).not.toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(1, dtoSinNombre);
    });

    // CASO 7: Actualización con nombre único (mismo ID)
    it('debería actualizar cuando nombre pertenece a la misma marca', async () => {
      mockRepository.findByName.mockResolvedValue(marcaMock);
      mockRepository.update.mockResolvedValue({ ...marcaMock, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(1, updateDto);
    });

    // CASO 8: Actualización con nombre de otra marca (conflicto)
    it('debería lanzar BadRequestException cuando nombre pertenece a otra marca', async () => {
      const otraMarca = { ...marcaMock, id: 2 };
      mockRepository.findByName.mockResolvedValue(otraMarca);

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow(
        `El nombre de marca '${updateDto.nombre}' ya está siendo usado por otra marca.`,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete - Transición de Estados', () => {
    // CASO 9: Eliminación exitosa de marca activa
    it('debería eliminar marca activa exitosamente', async () => {
      mockRepository.findOneActive.mockResolvedValue(marcaMock);
      mockProductoRepository.hasProductsByMarcaId.mockResolvedValue(false);
      mockMarcaLineaRepository.softDeleteAllByMarcaId.mockResolvedValue(undefined);
      mockRepository.softDelete.mockResolvedValue(undefined);

      await expect(service.softDelete(1)).resolves.not.toThrow();

      expect(mockRepository.findOneActive).toHaveBeenCalledWith(1);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
    });

    // CASO 10: Falla al eliminar marca inexistente
    it('debería lanzar NotFoundException al eliminar marca inexistente', async () => {
      mockRepository.findOneActive.mockResolvedValue(null);

      await expect(service.softDelete(999)).rejects.toThrow(NotFoundException);
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    // CASO 11: Restauración de marca eliminada
    it('debería restaurar marca eliminada', async () => {
      mockRepository.restore.mockResolvedValue(undefined);

      await expect(service.restore(1)).resolves.not.toThrow();

      expect(mockRepository.restore).toHaveBeenCalledWith(1);
    });
  });

  describe('findAllDeleted', () => {
    // CASO 12: Retorna marcas eliminadas
    it('debería retornar marcas eliminadas', async () => {
      const marcasEliminadas = [{ ...marcaMock, deletedAt: new Date() }];
      mockRepository.findAllDeleted.mockResolvedValue(marcasEliminadas);

      const result = await service.findAllDeleted();

      expect(result).toEqual(marcasEliminadas);
      expect(mockRepository.findAllDeleted).toHaveBeenCalledTimes(1);
    });
  });
});
