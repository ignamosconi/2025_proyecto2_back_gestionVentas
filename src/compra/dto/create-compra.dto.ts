// 📄 src/compras/dto/create-compra.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetalleCompraDto } from './create-detalle-compra.dto';
import { MetodoPagoCompraEnum } from '../helpers/metodo-pago-compra.enum';

export class CreateCompraDto {
  @ApiProperty({
    description: 'ID del proveedor al que se realiza la compra',
    type: Number,
  })
  @IsNotEmpty({ message: 'El ID del proveedor es obligatorio.' })
  @IsInt({ message: 'El ID del proveedor debe ser un número entero.' })
  idProveedor: number;

  @ApiProperty({
    description: 'Método de pago de la compra',
    enum: MetodoPagoCompraEnum,
  })
  @IsNotEmpty({ message: 'El método de pago es obligatorio.' })
  @IsEnum(MetodoPagoCompraEnum, { message: 'El método de pago no es válido.' })
  metodoPago: MetodoPagoCompraEnum;

  @ApiProperty({
    type: [CreateDetalleCompraDto],
    description: 'Lista de productos comprados',
  })
  @IsNotEmpty({
    message: 'La compra debe tener al menos un detalle (producto).',
  })
  @IsArray({ message: 'Los detalles deben ser un array.' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleCompraDto) // Necesario para la validación anidada
  detalles: CreateDetalleCompraDto[];
}
