// src/catalogo/dto/create-linea.dto.ts

import { IsNotEmpty, IsString, MaxLength, IsOptional, IsAlphanumeric, IsNumber, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLineaDto {
    
    // Transformamos para eliminar el exceso de espacios en blanco y forzar mayúscula inicial
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString({ message: 'El nombre debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'El nombre de la línea es obligatorio.' })
    @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres.' })
    nombre: string;

    // CAMPO AÑADIDO: NECESARIO PARA LA LÓGICA DE PRODUCTOS (US 10)
    @IsNumber({}, { message: 'El ID de la marca debe ser un número.' })
    @IsPositive({ message: 'El ID de la marca debe ser positivo.' })
    @IsOptional() // Es opcional porque solo lo usamos cuando se crea una línea desde ProductoService
    marcaId?: number;
}