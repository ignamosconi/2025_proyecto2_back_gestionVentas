// src/proveedores/dto/create-producto-proveedor.dto.ts (CORREGIDO)

import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
// Ya NO se extiende la Entidad ni se usa PickType.

export class CreateProductoProveedorDto {
  @ApiProperty({ description: 'ID del Producto.' })
  @IsNumber({}, { message: 'El ID del producto debe ser un número.' })
  @IsPositive({ message: 'El ID del producto debe ser positivo.' })
  @IsNotEmpty({ message: 'El ID del producto es obligatorio.' })
  idProducto: number;

  @ApiProperty({ description: 'ID del Proveedor.' })
  @IsNumber({}, { message: 'El ID del proveedor debe ser un número.' })
  @IsPositive({ message: 'El ID del proveedor debe ser positivo.' })
  @IsNotEmpty({ message: 'El ID del proveedor es obligatorio.' })
  idProveedor: number;

  @ApiProperty({ description: 'Código del proveedor para este producto.' })
  @IsString({ message: 'El código debe ser un string.' })
  @IsNotEmpty({ message: 'El código del proveedor es obligatorio.' })
  codigoProveedor: string;
}
