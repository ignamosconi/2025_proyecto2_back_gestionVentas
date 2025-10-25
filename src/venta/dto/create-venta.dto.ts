import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
  IsArray,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDetalleVentaDto } from './create-detalle-venta.dto';
import { MetodoPago } from '../enums/metodo-pago.enum';

export class CreateVentaDto {
  @ApiProperty({
    description: 'Método de pago utilizado en la venta.',
    example: 'Efectivo',
  })
  @IsEnum(MetodoPago, { message: 'Método de pago inválido.' })
  metodoPago: MetodoPago;

  @ApiProperty({
    description: 'ID del usuario que realiza la venta.',
    example: 1,
  })

  @ApiProperty({
    description: 'Lista de los detalles (productos vendidos) incluidos en esta venta.',
    type: [CreateDetalleVentaDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un producto en la venta.' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalles: CreateDetalleVentaDto[];
}
