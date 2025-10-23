import { EventosAuditoria } from '../helpers/enum.eventos';
import { AuditoriaLogDTO } from '../dto/auditoria-log.dto';

export interface IAuditoriaController {
  obtenerEventos(
    userId?: number,
    tipo_evento?: EventosAuditoria,
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<AuditoriaLogDTO[]>;
}
