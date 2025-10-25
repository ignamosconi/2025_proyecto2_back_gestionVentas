import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UpdateDetalleVentaDto } from './update-detalle-venta.dto';
import { ArrayMinSize, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { MetodoPago } from 'src/venta/enums/metodo-pago.enum';

export class UpdateVentaDto {
  @ApiProperty({ required: false })
  @IsEnum(MetodoPago, { message: 'Método de pago inválido.' })
  @IsOptional()
  metodoPago?: MetodoPago;

  @ApiProperty({ type: [UpdateDetalleVentaDto], required: false })
  @ArrayMinSize(1, {
    message: 'Debe incluir al menos un producto en la venta.',
  })
  @IsOptional()
  detalles?: UpdateDetalleVentaDto[];
}
