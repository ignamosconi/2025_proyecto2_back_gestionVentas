import { Injectable } from '@nestjs/common';
import { IAuditoriaRepository } from '../interfaces/auditoria.repository.interface';
import { AuditLogEntity } from '../entities/registro-auditoria.entity';
import { EventosAuditoria } from '../helpers/enum.eventos';
import { Repository, DataSource } from 'typeorm';

@Injectable()
export class AuditoriaRepository implements IAuditoriaRepository {
  private readonly repository: Repository<AuditLogEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(AuditLogEntity);
  }

  async saveAuditLog(
    userId: number,
    tipo_evento: EventosAuditoria,
    detalle?: string,
  ): Promise<AuditLogEntity> {
    const auditLog = this.repository.create({
      user: { id: userId },
      tipo_evento,
      detalle,
    });

    return await this.repository.save(auditLog);
  }

  async findAuditLogs(
    userId?: number,
    tipo_evento?: EventosAuditoria,
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Promise<AuditLogEntity[]> {
    const qb = this.repository.createQueryBuilder('audit');

    if (userId) {qb.andWhere('audit.userId = :userId', { userId });}
    if (tipo_evento)
      {qb.andWhere('audit.tipo_evento = :tipo_evento', { tipo_evento });}
    if (fechaDesde)
      {qb.andWhere('audit.fecha_hora >= :fechaDesde', { fechaDesde });}
    if (fechaHasta)
      {qb.andWhere('audit.fecha_hora <= :fechaHasta', { fechaHasta });}

    return await qb.leftJoinAndSelect('audit.user', 'user').getMany();
  }
}
