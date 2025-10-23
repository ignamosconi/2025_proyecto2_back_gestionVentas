import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UpdateDetalleVentaDto } from './update-detalle-venta.dto';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { MetodoPago } from 'src/enums/metodo-pago.enum';

export class UpdateVentaDto {
  @ApiProperty({ required: false })
  @IsEnum(MetodoPago, { message: 'Método de pago inválido.' })
  metodoPago?: MetodoPago;

  @ApiProperty({ type: [UpdateDetalleVentaDto], required: false })
  @IsOptional()
  detalles?: UpdateDetalleVentaDto[];
}
