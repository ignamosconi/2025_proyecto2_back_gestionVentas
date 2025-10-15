import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; 
import { MarcaLinea } from '../entities/marca-linea.entity';
import { PickType } from '@nestjs/swagger';

// Usamos PickType de NestJS (que usa Pick de TypeScript)
// para asegurarnos de que el DTO solo tenga los campos de PK requeridos
export class CreateMarcaLineaDto extends PickType(MarcaLinea, [
    'marcaId', 
    'lineaId'
] as const) {
    // Nota: Aunque heredamos los campos, a veces necesitas redefinir los decoradores 
    // de class-validator y swagger para asegurar la validación.

    @ApiProperty({ description: 'ID de la Marca.' })
    @IsNumber({}, { message: 'El ID de la marca debe ser un número.' })
    @IsPositive({ message: 'El ID de la marca debe ser positivo.' })
    @IsNotEmpty({ message: 'El ID de la marca es obligatorio.' })
    marcaId: number;
    
    @ApiProperty({ description: 'ID de la Línea.' })
    @IsNumber({}, { message: 'El ID de la línea debe ser un número.' })
    @IsPositive({ message: 'El ID de la línea debe ser positivo.' })
    @IsNotEmpty({ message: 'El ID de la línea es obligatorio.' })
    lineaId: number;
}