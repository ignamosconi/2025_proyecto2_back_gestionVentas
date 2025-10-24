import { Expose, Type } from 'class-transformer';

// DTO simplificado para marca
export class MarcaSimpleDto {
    @Expose()
    id: number;

    @Expose()
    nombre: string;
}

// DTO simplificado para línea
export class LineaSimpleDto {
    @Expose()
    id: number;

    @Expose()
    nombre: string;
}

// DTO simplificado para proveedor en producto
export class ProveedorProductoDto {
    @Expose()
    idProveedor: number;

    @Expose()
    nombre: string;
}

// DTO simplificado para la relación producto-proveedor
export class ProductoProveedorSimpleDto {
    @Expose()
    @Type(() => ProveedorProductoDto)
    proveedor: ProveedorProductoDto;
}

// DTO de producto para respuestas de venta (incluye marca, línea y proveedores)
export class ProductoVentaResponseDto {
    
    @Expose()
    idProducto: number;
    
    @Expose()
    nombre: string;
    
    @Expose()
    precio: number;
    
    @Expose()
    stock: number;

    @Expose()
    idMarca: number;

    @Expose()
    idLinea: number;

    @Expose()
    @Type(() => MarcaSimpleDto)
    marca: MarcaSimpleDto;

    @Expose()
    @Type(() => LineaSimpleDto)
    linea: LineaSimpleDto;

    @Expose()
    @Type(() => ProductoProveedorSimpleDto)
    proveedores: ProductoProveedorSimpleDto[];
}
