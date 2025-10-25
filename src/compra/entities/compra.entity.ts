import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, RelationId, } from 'typeorm';
import { DetalleCompra } from './detalle-compra.entity';
import { Proveedor } from '../../proveedor/entities/proveedor.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { MetodoPagoCompraEnum } from '../helpers/metodo-pago-compra.enum';



@Entity('compra')
export class Compra {
  @PrimaryGeneratedColumn()
  idCompra: number;

  @Column('date')
  fechaCreacion: Date; // Autocompletada

  @Column('enum', { enum: MetodoPagoCompraEnum })
  metodoPago: MetodoPagoCompraEnum;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number; // Calculado automáticamente

  // ---------------------------------------------------------------------
  // RELACIONES (FKs)
  // ---------------------------------------------------------------------

  // FK idProveedor (Muchas Compras a un Proveedor)
  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'idProveedor' })
  proveedor: Proveedor;

  @RelationId((compra: Compra) => compra.proveedor)
  idProveedor: number;

  // FK idUsuario (Muchas Compras a un Usuario/Empleado)
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'idUsuario' })
  usuario: UserEntity; // El usuario que registró la compra

  @RelationId((compra: Compra) => compra.usuario)
  idUsuario: number;

  // Una Compra tiene muchos DetalleCompra
  @OneToMany(() => DetalleCompra, (detalle) => detalle.compra, { 
      cascade: ['insert', 'update'],  // Permite guardar detalles junto con la compra
      eager: true
  })
  detalles: DetalleCompra[];
}