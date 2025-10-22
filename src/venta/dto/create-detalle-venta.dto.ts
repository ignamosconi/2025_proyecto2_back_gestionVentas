import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetalleVentaDto {
  @ApiProperty({
    description: 'ID del producto vendido',
    example: 1,
  })
  @IsNumber({}, { message: 'El ID del producto debe ser numérico.' })
  @IsPositive({ message: 'El ID del producto debe ser positivo.' })
  @IsNotEmpty({ message: 'El ID del producto es obligatorio.' })
  idProducto: number;

  @ApiProperty({
    description: 'Cantidad vendida de este producto',
    example: 2,
  })
  @IsNumber({}, { message: 'La cantidad debe ser numérica.' })
  @IsPositive({ message: 'La cantidad debe ser mayor a cero.' })
  @IsNotEmpty({ message: 'La cantidad es obligatoria.' })
  cantidad: number;
}
