// src/catalogo/entities/marca-linea.entity.ts

import { Entity, PrimaryColumn, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { Marca } from './marca.entity'; // Ajusta la ruta si es necesario
import { Linea } from './linea.entity'; // Ajusta la ruta si es necesario

@Entity('marca_linea')
export class MarcaLinea {
  
  // 1. Usa @PrimaryColumn para definir la clave compuesta.
  @PrimaryColumn() 
  marcaId: number;

  // 1. Usa @PrimaryColumn para definir la clave compuesta.
  @PrimaryColumn()
  lineaId: number;
  
  // 2. ELIMINA la opción `{ primary: true }` de aquí.
  @ManyToOne(() => Marca, (marca) => marca.marcaLineas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'marcaId' }) 
  marca: Marca;
  

  // 2. ELIMINA la opción `{ primary: true }` de aquí.
  @ManyToOne(() => Linea, (linea) => linea.marcaLineas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lineaId' })
  linea: Linea;
}