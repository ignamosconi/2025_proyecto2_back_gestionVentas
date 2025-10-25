import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Venta } from './venta.entity';
import { Producto } from '../../producto/entities/producto.entity';
import { Exclude } from 'class-transformer';

@Entity('detalle_venta')
export class DetalleVenta {
  @PrimaryGeneratedColumn()
  idDetalleVenta: number;

  @ManyToOne(() => Venta, (venta) => venta.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idVenta' })
  @Exclude()
  venta: Venta;

  @ManyToOne(() => Producto, { eager: true })
  @JoinColumn({ name: 'idProducto' })
  producto: Producto;

  @Column()
  cantidad: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: number;

  @Column()
  idProducto: number; // Propiedad que el DTO intentará leer
}
