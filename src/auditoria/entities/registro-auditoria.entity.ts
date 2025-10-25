//ARCHIVO: registro-auditoria.entity.ts

import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { EventosAuditoria } from '../helpers/enum.eventos';


@Entity('registro_auditoria')
export class AuditLogEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  idAuditoria: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_hora: Date;

  @Column({ type: 'enum', enum: EventosAuditoria })
  tipo_evento: EventosAuditoria;
  
  @Column({ type: 'text', nullable: true })
  detalle?: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}