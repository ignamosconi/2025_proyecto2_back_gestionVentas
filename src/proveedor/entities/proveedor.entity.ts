// src/proveedores/entities/proveedor.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn, Index } from 'typeorm';
import { ProductoProveedor } from './producto-proveedor.entity';


@Entity()
@Index('IDX_PROVEEDOR_NOMBRE_ACTIVE', ['nombre'], { 
    unique: true,
    where: '"deletedAt" IS NULL'
})
export class Proveedor {
    @PrimaryGeneratedColumn()
    idProveedor: number;

    @Column()
    nombre: string;

    @Column({ nullable: true })
    direccion: string;

    @Column({ nullable: true })
    telefono: string;

    @Column({ type: 'timestamp',  default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
    
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date; // Marca de soft delete

    @OneToMany(() => ProductoProveedor, pp => pp.proveedor)
    productos: ProductoProveedor[];
}
