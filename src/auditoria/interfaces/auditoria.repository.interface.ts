import { AuditLogEntity } from '../entities/registro-auditoria.entity';
import { EventosAuditoria } from '../helpers/enum.eventos';

export interface IAuditoriaRepository {

  //Guardamos 
  saveAuditLog(userId: number, tipo_evento: EventosAuditoria, detalle?: string): Promise<AuditLogEntity>;

  //Todo opcional, porque pueden consultar lo que sea
  findAuditLogs(
    userId?: number,
    tipo_evento?: EventosAuditoria,
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Promise<AuditLogEntity[]>;
}
