// src/catalogo/entities/marca.entity.ts

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
//import { Linea } from '../../linea/entities/brand-line.entity'; // Asumo que BrandLine está en una carpeta 'brand-line'
//import { Producto } from '../../productos/entities/producto.entity'; // Asumo la entidad Producto en un módulo 'productos'

@Entity('marca')
// Criterio: "No puede haber dos nombres de marcas iguales en el sistema."
// Creamos un índice UNIQUE en la columna 'nombre'.
@Index(['nombre'], { unique: true })
// Se agrega la condición para que la unicidad solo aplique a marcas NO eliminadas:
// @Index(['nombre', 'deletedAt'], { unique: true }) // Alternativa más robusta para Soft Delete
export class Marca {
  
  @PrimaryGeneratedColumn()
  id: number; //DEUDA TECNICA: Cambiar a idMarca para homogeneizar con Producto

  /**
   * Criterio: "El formulario de creación de marcas debe permitir ingresar: nombre"
   * Se combina con @Index para asegurar unicidad.
   */
  @Column({ length: 100 })
  nombre: string;

  /**
   * Criterio: "El formulario de creación de marcas debe permitir ingresar: descripción"
   */
  @Column({ type: 'text', nullable: true })
  descripcion: string;

  // --- Implementación de Criterios de Aceptación ---

  /**
   * Criterio: "Las marcas eliminadas no deben aparecer..."
   * Habilita la 'eliminación suave' (soft delete).
   * TypeORM filtra automáticamente las entidades con esta columna rellenada en las consultas 'find'.
   */

  @Column({ type: 'timestamp',  default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // --- Relaciones ---

  /**
   * Criterio: "Si una marca tiene productos asociados, el sistema debe impedir su eliminación..."
   * Relación One-to-Many con la entidad Producto.
   * Usaremos esta relación en el servicio para contar los productos antes de intentar softDelete.
   */
  //@OneToMany(() => Producto, (producto) => producto.marca)
  //productos: Producto[];

  /**
   * Relación Many-to-Many con Línea a través de la tabla intermedia BrandLine (MarcaLinea).
   */
  @OneToMany(() => MarcaLinea, (marcaLinea) => marcaLinea.marca)
  marcaLineas: MarcaLinea[];

  @OneToMany(() => Producto, (producto) => producto.marca)
  productos: Producto[];
}