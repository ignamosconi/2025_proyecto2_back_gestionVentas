// src/productos/dto/update-producto.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';

// US 7: Permite modificar la información del producto. 
// PartialType hace que todos los campos del DTO de creación sean opcionales.
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}