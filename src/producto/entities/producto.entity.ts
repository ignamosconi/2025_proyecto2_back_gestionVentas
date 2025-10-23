import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    JoinColumn, 
    OneToMany,
    DeleteDateColumn 
} from 'typeorm';
import { Linea } from '../../catalogo/entities/linea.entity';
//import { ProductoProveedor } from '../../proveedor/entities/producto-proveedor.entity';
import { Marca } from '../../catalogo/entities/marca.entity';
import { ProductoProveedor } from '../../proveedor/entities/producto-proveedor.entity';

@Entity('producto')
export class Producto {
    @PrimaryGeneratedColumn()
    idProducto: number;

    @Column({ type: 'varchar', length: 255 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'float' })
    precio: number;

    @Column({ type: 'int' })
    stock: number;

    @Column({ type: 'int', name: 'alerta_stock' })
    alertaStock: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    foto: string;

    @Column({ type: 'timestamp',  default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;

    // FK a Linea
    @Column({ type: 'int', name: 'id_linea' })
    idLinea: number;

    @ManyToOne(() => Linea, (linea) => linea.productos)
    @JoinColumn({ name: 'id_linea', referencedColumnName: 'id' })
    linea: Linea;

    // FK a Marca
    @Column({ type: 'int', name: 'id_marca' })
    idMarca: number;

    @ManyToOne(() => Marca, (marca) => marca.productos)
    @JoinColumn({ name: 'id_marca', referencedColumnName: 'id' })
    marca: Marca;

    //Relación M:M con Proveedor
    @OneToMany(() => ProductoProveedor, (pp) => pp.producto)
    proveedores: ProductoProveedor[];
}
