import { AuditoriaLogDTO } from '../dto/auditoria-log.dto';
import { AuditLogEntity } from '../entities/registro-auditoria.entity';
import { EventosAuditoria } from '../helpers/enum.eventos';

export interface IAuditoriaService {
  registrarEvento(
    userId: number,
    tipo_evento: EventosAuditoria,
    detalle?: string,
  ): Promise<AuditLogEntity>;

  listarEventos(
    userId?: number,
    tipo_evento?: EventosAuditoria,
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Promise<AuditoriaLogDTO[]>;
}
