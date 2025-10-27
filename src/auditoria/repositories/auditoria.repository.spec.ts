import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { AuditoriaRepository } from './auditoria.repository';
import { AuditLogEntity } from '../entities/registro-auditoria.entity';
import { EventosAuditoria } from '../helpers/enum.eventos';

describe('AuditoriaRepository', () => {
  let repository: AuditoriaRepository;
  let mockRepository: jest.Mocked<Repository<AuditLogEntity>>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<AuditLogEntity>>;

  const mockAuditLog: AuditLogEntity = {
    id: 1,
    user: { id: 1 } as any,
    tipo_evento: EventosAuditoria.LOGIN,
    detalle: 'Usuario inició sesión',
    fecha_hora: new Date(),
  };

  beforeEach(async () => {
    // Mock QueryBuilder
    mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;

    // Mock Repository
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    // Mock DataSource
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaRepository,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<AuditoriaRepository>(AuditoriaRepository);
  });

  describe('saveAuditLog', () => {
    it('debería guardar un log de auditoría exitosamente', async () => {
      const auditLogData = {
        user: { id: 1 },
        tipo_evento: EventosAuditoria.LOGIN,
        detalle: 'Usuario inició sesión',
      };

      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      const result = await repository.saveAuditLog(
        1,
        EventosAuditoria.LOGIN,
        'Usuario inició sesión',
      );

      expect(result).toEqual(mockAuditLog);
      expect(mockRepository.create).toHaveBeenCalledWith(auditLogData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockAuditLog);
    });

    it('debería guardar log sin detalle opcional', async () => {
      const auditLogData = {
        user: { id: 1 },
        tipo_evento: EventosAuditoria.LOGOUT,
        detalle: undefined,
      };

      mockRepository.create.mockReturnValue({ ...mockAuditLog, detalle: undefined });
      mockRepository.save.mockResolvedValue({ ...mockAuditLog, detalle: undefined });

      const result = await repository.saveAuditLog(1, EventosAuditoria.LOGOUT);

      expect(result.detalle).toBeUndefined();
      expect(mockRepository.create).toHaveBeenCalledWith(auditLogData);
    });

    it('debería guardar diferentes tipos de eventos', async () => {
      const eventosTestear = [
        EventosAuditoria.REGISTRO_VENTA,
        EventosAuditoria.REGISTRO_COMPRA,
        EventosAuditoria.MODIFICAR_VENTA,
        EventosAuditoria.MODIFICAR_COMPRA,
      ];

      for (const evento of eventosTestear) {
        mockRepository.create.mockReturnValue({ ...mockAuditLog, tipo_evento: evento });
        mockRepository.save.mockResolvedValue({ ...mockAuditLog, tipo_evento: evento });

        const result = await repository.saveAuditLog(1, evento, `Test ${evento}`);

        expect(result.tipo_evento).toBe(evento);
      }
    });
  });

  describe('findAuditLogs', () => {
    it('debería retornar todos los logs sin filtros', async () => {
      const mockLogs = [mockAuditLog];
      mockQueryBuilder.getMany.mockResolvedValue(mockLogs);

      const result = await repository.findAuditLogs();

      expect(result).toEqual(mockLogs);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('audit');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('audit.user', 'user');
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('debería filtrar por userId', async () => {
      const mockLogs = [mockAuditLog];
      mockQueryBuilder.getMany.mockResolvedValue(mockLogs);

      const result = await repository.findAuditLogs(1);

      expect(result).toEqual(mockLogs);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.userId = :userId',
        { userId: 1 },
      );
    });

    it('debería filtrar por tipo_evento', async () => {
      const mockLogs = [mockAuditLog];
      mockQueryBuilder.getMany.mockResolvedValue(mockLogs);

      const result = await repository.findAuditLogs(undefined, EventosAuditoria.LOGIN);

      expect(result).toEqual(mockLogs);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.tipo_evento = :tipo_evento',
        { tipo_evento: EventosAuditoria.LOGIN },
      );
    });

    it('debería filtrar por fechaDesde', async () => {
      const fechaDesde = new Date('2025-01-01');
      const mockLogs = [mockAuditLog];
      mockQueryBuilder.getMany.mockResolvedValue(mockLogs);

      const result = await repository.findAuditLogs(undefined, undefined, fechaDesde);

      expect(result).toEqual(mockLogs);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.fecha_hora >= :fechaDesde',
        { fechaDesde },
      );
    });

    it('debería filtrar por fechaHasta', async () => {
      const fechaHasta = new Date('2025-12-31');
      const mockLogs = [mockAuditLog];
      mockQueryBuilder.getMany.mockResolvedValue(mockLogs);

      const result = await repository.findAuditLogs(undefined, undefined, undefined, fechaHasta);

      expect(result).toEqual(mockLogs);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.fecha_hora <= :fechaHasta',
        { fechaHasta },
      );
    });

    it('debería aplicar múltiples filtros simultáneamente', async () => {
      const fechaDesde = new Date('2025-01-01');
      const fechaHasta = new Date('2025-12-31');
      const mockLogs = [mockAuditLog];
      mockQueryBuilder.getMany.mockResolvedValue(mockLogs);

      const result = await repository.findAuditLogs(
        1,
        EventosAuditoria.LOGIN,
        fechaDesde,
        fechaHasta,
      );

      expect(result).toEqual(mockLogs);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.userId = :userId',
        { userId: 1 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.tipo_evento = :tipo_evento',
        { tipo_evento: EventosAuditoria.LOGIN },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.fecha_hora >= :fechaDesde',
        { fechaDesde },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.fecha_hora <= :fechaHasta',
        { fechaHasta },
      );
    });

    it('debería retornar array vacío cuando no hay logs', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await repository.findAuditLogs();

      expect(result).toEqual([]);
    });

    it('debería incluir relación con usuario', async () => {
      const mockLogs = [mockAuditLog];
      mockQueryBuilder.getMany.mockResolvedValue(mockLogs);

      await repository.findAuditLogs();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('audit.user', 'user');
    });
  });
});
