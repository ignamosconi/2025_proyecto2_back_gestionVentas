import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { MarcaLinea } from './marca-linea.entity';
import { Producto } from 'src/producto/entities/producto.entity';

@Entity('linea')
@Index(['nombre'], { unique: true })
export class Linea {
  @PrimaryGeneratedColumn()
  id: number; //DEUDA TECNICA: Cambiar a idLinea para homogeneizar con Producto

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'timestamp',  default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => MarcaLinea, (marcaLinea) => marcaLinea.linea)
  marcaLineas: MarcaLinea[];

  @OneToMany(() => Producto, (producto) => producto.linea)
  productos: Producto[];
}
