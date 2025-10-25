import { Test, TestingModule } from '@nestjs/testing';
import { AuditoriaService } from './auditoria.service';
import { IAuditoriaRepository } from '../interfaces/auditoria.repository.interface';
import { AuditLogEntity } from '../entities/registro-auditoria.entity';
import { EventosAuditoria } from '../helpers/enum.eventos';
import { UserRole } from '../../users/helpers/enum.roles';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let mockRepository: jest.Mocked<IAuditoriaRepository>;

  const userMock = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    phone: '123456',
    address: 'Test Address',
    role: UserRole.OWNER,
  };

  const auditLogMock: AuditLogEntity = {
    idAuditoria: 1,
    fecha_hora: new Date('2025-10-24T10:00:00'),
    tipo_evento: EventosAuditoria.LOGIN,
    detalle: 'Usuario inició sesión',
    user: userMock as any,
  };

  beforeEach(async () => {
    mockRepository = {
      saveAuditLog: jest.fn(),
      findAuditLogs: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaService,
        { provide: 'IAuditoriaRepository', useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AuditoriaService>(AuditoriaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarEvento', () => {
    // CASO 1: Registra evento con detalle (Partición Válida)
    it('debería registrar evento de auditoría con detalle', async () => {
      mockRepository.saveAuditLog.mockResolvedValue(auditLogMock);

      const result = await service.registrarEvento(
        1,
        EventosAuditoria.LOGIN,
        'Usuario inició sesión',
      );

      expect(result).toEqual(auditLogMock);
      expect(mockRepository.saveAuditLog).toHaveBeenCalledWith(
        1,
        EventosAuditoria.LOGIN,
        'Usuario inició sesión',
      );
    });

    // CASO 2: Registra evento sin detalle (Partición Válida)
    it('debería registrar evento sin detalle', async () => {
      const auditLogSinDetalle = { ...auditLogMock, detalle: undefined };
      mockRepository.saveAuditLog.mockResolvedValue(auditLogSinDetalle);

      const result = await service.registrarEvento(1, EventosAuditoria.LOGOUT);

      expect(result).toEqual(auditLogSinDetalle);
      expect(mockRepository.saveAuditLog).toHaveBeenCalledWith(
        1,
        EventosAuditoria.LOGOUT,
        undefined,
      );
    });

    // CASO 3: Registra diferentes tipos de eventos (Tabla de Decisión)
    it('debería registrar evento de tipo CREAR_PRODUCTO', async () => {
      const crearProductoLog = {
        ...auditLogMock,
        tipo_evento: EventosAuditoria.CREAR_PRODUCTO,
      };
      mockRepository.saveAuditLog.mockResolvedValue(crearProductoLog);

      const result = await service.registrarEvento(
        1,
        EventosAuditoria.CREAR_PRODUCTO,
        'Producto creado',
      );

      expect(result.tipo_evento).toBe(EventosAuditoria.CREAR_PRODUCTO);
    });
  });

  describe('listarEventos', () => {
    // CASO 4: Lista todos los eventos sin filtros
    it('debería listar todos los eventos sin filtros', async () => {
      const eventos = [auditLogMock];
      mockRepository.findAuditLogs.mockResolvedValue(eventos);

      const result = await service.listarEventos();

      expect(result).toHaveLength(1);
      expect(result[0].idAuditoria).toBe(1);
      expect(result[0].tipo_evento).toBe(EventosAuditoria.LOGIN);
      expect(result[0].user.email).toBe('john@test.com');
      expect(mockRepository.findAuditLogs).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    // CASO 5: Filtra eventos por userId (Partición de Equivalencia)
    it('debería filtrar eventos por userId', async () => {
      const eventos = [auditLogMock];
      mockRepository.findAuditLogs.mockResolvedValue(eventos);

      const result = await service.listarEventos(1);

      expect(result).toHaveLength(1);
      expect(mockRepository.findAuditLogs).toHaveBeenCalledWith(
        1,
        undefined,
        undefined,
        undefined,
      );
    });

    // CASO 6: Filtra eventos por tipo de evento
    it('debería filtrar eventos por tipo de evento', async () => {
      const eventos = [auditLogMock];
      mockRepository.findAuditLogs.mockResolvedValue(eventos);

      const result = await service.listarEventos(
        undefined,
        EventosAuditoria.LOGIN,
      );

      expect(result).toHaveLength(1);
      expect(result[0].tipo_evento).toBe(EventosAuditoria.LOGIN);
      expect(mockRepository.findAuditLogs).toHaveBeenCalledWith(
        undefined,
        EventosAuditoria.LOGIN,
        undefined,
        undefined,
      );
    });

    // CASO 7: Filtra eventos por rango de fechas
    it('debería filtrar eventos por rango de fechas', async () => {
      const fechaDesde = new Date('2025-10-01');
      const fechaHasta = new Date('2025-10-31');
      const eventos = [auditLogMock];
      mockRepository.findAuditLogs.mockResolvedValue(eventos);

      const result = await service.listarEventos(
        undefined,
        undefined,
        fechaDesde,
        fechaHasta,
      );

      expect(result).toHaveLength(1);
      expect(mockRepository.findAuditLogs).toHaveBeenCalledWith(
        undefined,
        undefined,
        fechaDesde,
        fechaHasta,
      );
    });

    // CASO 8: Filtra con todos los parámetros combinados
    it('debería filtrar con todos los parámetros combinados', async () => {
      const fechaDesde = new Date('2025-10-01');
      const fechaHasta = new Date('2025-10-31');
      const eventos = [auditLogMock];
      mockRepository.findAuditLogs.mockResolvedValue(eventos);

      const result = await service.listarEventos(
        1,
        EventosAuditoria.LOGIN,
        fechaDesde,
        fechaHasta,
      );

      expect(result).toHaveLength(1);
      expect(mockRepository.findAuditLogs).toHaveBeenCalledWith(
        1,
        EventosAuditoria.LOGIN,
        fechaDesde,
        fechaHasta,
      );
    });

    // CASO 9: Retorna array vacío cuando no hay eventos (Valores Límite)
    it('debería retornar array vacío cuando no hay eventos', async () => {
      mockRepository.findAuditLogs.mockResolvedValue([]);

      const result = await service.listarEventos();

      expect(result).toEqual([]);
    });

    // CASO 10: Mapea correctamente los datos del usuario
    it('debería mapear correctamente los datos del usuario en el DTO', async () => {
      const eventos = [auditLogMock];
      mockRepository.findAuditLogs.mockResolvedValue(eventos);

      const result = await service.listarEventos();

      expect(result[0].user).toEqual({
        id: userMock.id,
        firstName: userMock.firstName,
        lastName: userMock.lastName,
        email: userMock.email,
        phone: userMock.phone,
        address: userMock.address,
        role: userMock.role,
      });
    });
  });
});
