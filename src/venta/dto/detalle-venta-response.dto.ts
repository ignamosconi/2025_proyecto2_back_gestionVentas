// DTO para la respuesta del DetalleVenta
import { ProductoVentaResponseDto } from 'src/producto/dto/producto-venta-response.dto';
import { Expose, Type, Transform } from 'class-transformer';

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
    @Transform(({ obj }) => obj.idProducto || obj.producto?.idProducto)
    idProducto: number;

    // Incluir información del producto para filtrado
    @Expose()
    @Type(() => ProductoVentaResponseDto)
    producto: ProductoVentaResponseDto;

    // NOTA CLAVE: Aquí NO incluimos la propiedad 'venta', rompiendo el ciclo.
}