// src/productos/dto/update-producto.dto.ts

import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';

// US 7: Permite modificar la información del producto. 
// PartialType hace que todos los campos del DTO de creación sean opcionales.

// 1. Usamos OmitType para crear un DTO base de actualización sin el campo de creación.
// El campo 'nombreNuevaLinea' no tiene columna en la BD y no debe estar en el DTO de actualización.
class BaseUpdateProductoDto extends OmitType(CreateProductoDto, [
    'nombreNuevaLinea', 
] as const) {}

export class UpdateProductoDto extends PartialType(BaseUpdateProductoDto) {}