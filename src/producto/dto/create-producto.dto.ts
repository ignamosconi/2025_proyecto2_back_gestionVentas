import { IsNotEmpty, IsNumber, IsPositive, IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
    
    // US 7: Campos básicos y validaciones
    @ApiProperty({ description: 'Nombre del producto.', maxLength: 255 })
    @IsNotEmpty({ message: 'El nombre es obligatorio.' })
    @IsString()
    @MaxLength(255)
    nombre: string;

    @ApiProperty({ description: 'Descripción detallada del producto.', required: false })
    @IsString()
    @IsOptional()
    descripcion?: string; // Usar '?' para opcional en TypeScript

    @ApiProperty({ description: 'Precio de venta del producto.' })
    @IsNumber({}, { message: 'El precio debe ser un número.' })
    @IsPositive({ message: 'El precio debe ser positivo' })
    precio: number;

    @ApiProperty({ description: 'Stock disponible en inventario.' })
    @IsInt({ message: 'El stock debe ser un número entero.' })
    @Min(0, { message: 'El stock no puede ser negativo.' })
    stock: number;

    @ApiProperty({ description: 'Cantidad mínima para alerta de stock.' })
    @IsInt({ message: 'La alerta de stock debe ser un número entero.' })
    @Min(0, { message: 'La alerta de stock no puede ser negativa.' })
    alertaStock: number; 

    @ApiProperty({ description: 'URL de la foto del producto.', required: false })
    @IsString()
    @IsOptional()
    foto?: string;

    // --- Relaciones (FKs y Lógica US 10) ---

    // FK Directa a Marca
    @ApiProperty({ description: 'ID de la Marca. Es la FK directa del Producto.' })
    @IsNotEmpty({ message: 'El ID de la marca es obligatorio.' })
    @IsNumber({}, { message: 'El ID de la marca debe ser un número.' })
    @IsPositive({ message: 'El ID de la marca debe ser positivo.' })
    idMarca: number; 

    // US 10: Opción A - Vínculo a Línea existente.
    @ApiProperty({ description: 'ID de la Línea existente. Se usará si no se proporciona nombreNuevaLinea.' })
    @IsNumber({}, { message: 'El ID de la línea debe ser un número.' })
    @IsPositive({ message: 'El ID de la línea debe ser positivo.' })
    @IsOptional()
    idLinea?: number; 

    // US 10: Opción B - Nombre de la Línea a crear "urgentemente" (Lógica)
    @ApiProperty({ description: 'Nombre de una nueva Línea para crear urgentemente si no se proporciona lineaId (US 10).' })
    @IsString()
    @IsOptional()
    nombreNuevaLinea?: string;
}