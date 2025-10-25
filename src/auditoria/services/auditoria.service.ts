import { Inject, Injectable } from '@nestjs/common';
import { IAuditoriaService } from '../interfaces/auditoria.service.interface';
import { IAuditoriaRepository } from '../interfaces/auditoria.repository.interface';
import { AuditLogEntity } from '../entities/registro-auditoria.entity';
import { EventosAuditoria } from '../helpers/enum.eventos';
import { AuditoriaLogDTO } from '../dto/auditoria-log.dto';

@Injectable()
export class AuditoriaService implements IAuditoriaService {
  constructor(
    @Inject('IAuditoriaRepository')
    private readonly auditoriaRepository: IAuditoriaRepository,
  ) {}

  //MÉTODOS PRIVADOS
  private mapToDTO(evento: AuditLogEntity): AuditoriaLogDTO {
    return new AuditoriaLogDTO({
      idAuditoria: evento.idAuditoria,
      fecha_hora: evento.fecha_hora,
      tipo_evento: evento.tipo_evento,
      detalle: evento.detalle,
      user: {
        id: evento.user.id,
        firstName: evento.user.firstName,
        lastName: evento.user.lastName,
        email: evento.user.email,
        phone: evento.user.phone,
        address: evento.user.address,
        role: evento.user.role,
      },
    });
  }

  //MÉTODOS PUBLICOS
  async registrarEvento(
    userId: number,
    tipo_evento: EventosAuditoria,
    detalle?: string,
  ): Promise<AuditLogEntity> {
    return this.auditoriaRepository.saveAuditLog(userId, tipo_evento, detalle);
  }

  async listarEventos(
    userId?: number,
    tipo_evento?: EventosAuditoria,
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Promise<AuditoriaLogDTO[]> {
    const eventos = await this.auditoriaRepository.findAuditLogs(
      userId,
      tipo_evento,
      fechaDesde,
      fechaHasta,
    );
    return eventos.map(this.mapToDTO);
  }
}
