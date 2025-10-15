// src/catalogo/dto/create-marca.dto.ts

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMarcaDto {
  
  /**
   * Criterio: "permitir ingresar: nombre"
   * Requisito: Nombre de la marca. Será validado en el servicio contra duplicados.
   */
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre de la marca es obligatorio.' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres.' })
  nombre: string;

  /**
   * Criterio: "permitir ingresar: descripción"
   * Descripción opcional de la marca.
   */
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @MaxLength(500, { message: 'La descripción no puede exceder los 500 caracteres.' })
  // @IsOptional() // Si la descripción es opcional. Si no se incluye esta línea, es implícitamente opcional.
  descripcion: string;
}