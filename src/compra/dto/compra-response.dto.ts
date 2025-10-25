import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DetalleCompraResponseDto } from './detalle-compra-response.dto';
import { MetodoPagoCompraEnum } from '../helpers/metodo-pago-compra.enum';

// Asumo que tienes un DTO simplificado para Usuario y Proveedor (como UserResponseDto y ProveedorResponseDto)

class UserSimpleResponseDto {
  @Expose() id: number;
  @Expose() email: string;
}

class ProveedorResponseDto {
  @Expose() idProveedor: number;
  @Expose() nombre: string;
}

export class CompraResponseDto {
  @ApiProperty()
  @Expose()
  idCompra: number;

  @ApiProperty({ type: Date })
  @Expose()
  fechaCreacion: Date;

  @ApiProperty({ enum: MetodoPagoCompraEnum })
  @Expose()
  metodoPago: MetodoPagoCompraEnum;

  // El total se expone como string para mantener la precisión decimal
  @ApiProperty()
  @Expose()
  total: string;

  // ---------------------------------------------
  // RELACIONES
  // ---------------------------------------------

  // Proveedor asociado
  @ApiProperty({ type: ProveedorResponseDto })
  @Expose()
  @Type(() => ProveedorResponseDto)
  proveedor: ProveedorResponseDto;

  // Usuario que registró la compra
  @ApiProperty({ type: UserSimpleResponseDto })
  @Expose()
  @Type(() => UserSimpleResponseDto)
  usuario: UserSimpleResponseDto;

  // Detalles de la Compra (el array de DetalleCompraResponseDto)
  @ApiProperty({ type: [DetalleCompraResponseDto] })
  @Expose()
  @Type(() => DetalleCompraResponseDto)
  detalles: DetalleCompraResponseDto[];
}
