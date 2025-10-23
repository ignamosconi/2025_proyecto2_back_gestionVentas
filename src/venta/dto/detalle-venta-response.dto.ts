// DTO para la respuesta del DetalleVenta
import { ProductoResponseDto } from 'src/producto/dto/producto-response.dto';
import { Expose, Type } from 'class-transformer';

export class DetalleVentaResponseDto {
    @Expose()
    idDetalleVenta: number;

    @Expose()
    cantidad: number;

    @Expose()
    precioUnitario: number;

    @Expose()
    subtotal: number;
    
    // Incluir solo los campos necesarios de Producto, usando un DTO anidado
    @Expose()
    idProducto: number;

    // NOTA CLAVE: Aquí NO incluimos la propiedad 'venta', rompiendo el ciclo.
}