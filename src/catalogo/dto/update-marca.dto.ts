// src/catalogo/dto/update-marca.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateMarcaDto } from './create-marca.dto';
import { IsOptional } from 'class-validator';

// Hereda las propiedades y validaciones de CreateMarcaDto,
// pero hace todas sus propiedades opcionales.
export class UpdateMarcaDto extends PartialType(CreateMarcaDto) {
  
  // Si usas PartialType, no necesitas redefinir y marcar con @IsOptional()
  // los campos 'nombre' y 'descripcion' a menos que necesites cambiar la validación.

  /**
   * Criterio: "No puede haber dos nombres de marcas iguales en el sistema."
   * Si el nombre se envía, debe pasar la misma validación de unicidad que en la creación.
   */
  @IsOptional()
  nombre?: string;
}