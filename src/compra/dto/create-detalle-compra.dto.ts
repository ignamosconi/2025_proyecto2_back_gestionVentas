import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateDetalleCompraDto {
  @ApiProperty({ description: 'ID del producto comprado', type: Number })
  @IsNotEmpty({ message: 'El ID del producto es obligatorio.' })
  @IsInt({ message: 'El ID del producto debe ser un número entero.' })
  idProducto: number;

  @ApiProperty({ description: 'Cantidad comprada del producto', type: Number })
  @IsNotEmpty({ message: 'La cantidad es obligatoria.' })
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @IsPositive({ message: 'La cantidad debe ser un número positivo.' })
  cantidad: number;

  // Nota: precioUnitario y subtotal NO se incluyen aquí, se calculan en el Service.
}
