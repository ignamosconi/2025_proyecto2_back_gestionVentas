import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DetalleCompraResponseDto {
  @ApiProperty()
  @Expose() // Exponer la clave primaria del detalle
  idDetalleCompra: number;

  @ApiProperty({ description: 'Cantidad comprada del producto' })
  @Expose()
  cantidad: number;

  // Los precios se exponen como string para mantener la precisión decimal si el campo es 'decimal' en TypeORM
  @ApiProperty({
    description: 'Precio unitario del producto al momento de la compra',
  })
  @Expose()
  precioUnitario: string;

  @ApiProperty({ description: 'Subtotal del detalle' })
  @Expose()
  subtotal: string;

  // Clave foránea explícita (FK)
  @ApiProperty({ description: 'ID del producto asociado a este detalle' })
  @Expose()
  idProducto: number;

  // Nota: No incluimos la entidad completa 'producto' aquí, solo el ID
}
