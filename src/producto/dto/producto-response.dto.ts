import { Expose } from 'class-transformer';

export class ProductoResponseDto {
  @Expose() // Indica que este campo debe ser incluido al mapear desde la entidad
  idProducto: number;

  @Expose()
  nombre: string;

  @Expose()
  precio: number;

  @Expose()
  stock: number; // Es útil para el cliente saber el stock restante

  // NOTA CLAVE: Aquí NO se incluye la colección 'detallesVenta' o similar,
  // que es la propiedad que apunta de vuelta al DetalleVenta.
}
