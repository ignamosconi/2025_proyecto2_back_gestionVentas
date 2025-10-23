import { AuditoriaUserDTO } from './auditoria-user.dto';

export class AuditoriaLogDTO {
  idAuditoria: number;
  fecha_hora: Date;
  tipo_evento: string;
  detalle?: string;
  user: AuditoriaUserDTO;

  constructor(partial: Partial<AuditoriaLogDTO>) {
    if (partial.user) {
      partial.user = new AuditoriaUserDTO(partial.user);
    }
    Object.assign(this, partial);
  }
}
