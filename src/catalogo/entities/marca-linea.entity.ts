// src/catalogo/entities/marca-linea.entity.ts

import { Entity, PrimaryColumn, ManyToOne, Unique } from 'typeorm';
import { Marca } from './marca.entity'; // Ajusta la ruta si es necesario
import { Linea } from './linea.entity'; // Ajusta la ruta si es necesario

@Entity('marca_linea')
export class MarcaLinea {
  
  // 1. Usa @PrimaryColumn para definir la clave compuesta.
  @PrimaryColumn() // 👈 CORRECTO
  marcaId: number;

  // 1. Usa @PrimaryColumn para definir la clave compuesta.
  @PrimaryColumn() // 👈 CORRECTO
  lineaId: number;
  
  // 2. ELIMINA la opción `{ primary: true }` de aquí.
  @ManyToOne(() => Marca, (marca) => marca.marcaLineas, { onDelete: 'CASCADE' })
  marca: Marca;

  // 2. ELIMINA la opción `{ primary: true }` de aquí.
  @ManyToOne(() => Linea, (linea) => linea.marcaLineas, { onDelete: 'CASCADE' })
  linea: Linea;
}