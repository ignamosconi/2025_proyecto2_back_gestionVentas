// src/catalogo/entities/linea.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { MarcaLinea } from './marca-linea.entity'; // Asumo que cambiaste el nombre de BrandLine a MarcaLinea

@Entity('linea')
@Index(['nombre'], { unique: true })
export class Linea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // --- Relación con Marca (Many-to-Many a través de MarcaLinea) ---
  
  // CORRECCIÓN CLAVE:
  // 1. El objeto de instancia es 'marcaLinea'.
  // 2. La propiedad que apunta de MarcaLinea a Linea es 'linea' (asumo por tu convención).
  @OneToMany(() => MarcaLinea, (marcaLinea) => marcaLinea.linea)
  marcaLineas: MarcaLinea[]; // Cambié el nombre de la propiedad a marcaLineas para mayor claridad
}