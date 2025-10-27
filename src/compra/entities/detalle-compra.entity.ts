import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Compra } from './compra.entity';
import { Producto } from '../../producto/entities/producto.entity';

@Entity('detalle_compra')
export class DetalleCompra {
  @PrimaryGeneratedColumn()
  idDetalleCompra: number;

  @Column('int')
  cantidad: number;

  // float en el DER, pero usamos decimales para precisión en TypeScript/TypeORM
  @Column('decimal', { precision: 10, scale: 2 })
  precioUnitario: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  // ---------------------------------------------------------------------
  // RELACIONES (FKs)
  // ---------------------------------------------------------------------

  // FK idCompra (Muchos DetalleCompra a una Compra)
  @ManyToOne(() => Compra, (compra) => compra.detalles, {
    onDelete: 'CASCADE', // Si se elimina la Compra, se eliminan los detalles
  })
  @JoinColumn({ name: 'idCompra' })
  compra: Compra;

  // TypeORM generará la columna 'idCompra'
  @RelationId((detalle: DetalleCompra) => detalle.compra)
  idCompra: number;

  // FK idProducto (Muchos DetalleCompra a un Producto)
  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'idProducto' })
  producto: Producto;

  // TypeORM generará la columna 'idProducto'
  @RelationId((detalle: DetalleCompra) => detalle.producto)
  idProducto: number;
}
