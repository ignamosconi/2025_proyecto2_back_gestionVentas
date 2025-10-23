import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { DetalleVenta } from './detalle-venta.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { MetodoPago } from 'src/enums/metodo-pago.enum';

@Entity('venta')
export class Venta {
  @PrimaryGeneratedColumn()
  idVenta: number;

  @CreateDateColumn({ name: 'fechaCreacion', type: 'timestamp' })
  fechaCreacion: Date;

  @Column({ type: 'enum', enum: MetodoPago })
  metodoPago: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total: number;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: UserEntity;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta, { cascade: ['insert', 'update'], eager: true })
  detalles: DetalleVenta[];
}
