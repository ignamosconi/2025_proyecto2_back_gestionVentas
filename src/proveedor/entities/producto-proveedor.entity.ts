import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, DeleteDateColumn } from 'typeorm';
import { Producto } from 'src/producto/entities/producto.entity';
import { Proveedor } from './proveedor.entity';


@Entity()
@Unique(['producto', 'proveedor'])
export class ProductoProveedor {
    @PrimaryGeneratedColumn()
    idProductoProveedor: number;

    @Column()
    idProducto: number; // FK explícita para Producto
    @ManyToOne(() => Producto, producto => producto.proveedores, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'idProducto', referencedColumnName: 'idProducto' })
    producto: Producto;

    @Column()
    idProveedor: number; // FK explícita para Proveedor
    @ManyToOne(() => Proveedor, proveedor => proveedor.productos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'idProveedor', referencedColumnName: 'idProveedor' })
    proveedor: Proveedor;

    @Column()
    codigoProveedor: string;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;
}
