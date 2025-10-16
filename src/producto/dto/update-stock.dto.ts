// src/productos/dto/update-stock.dto.ts

import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockDto {
    @ApiProperty({ 
        description: 'La cantidad a sumar o restar al stock. Positivo para aumentar, negativo para disminuir.',
        example: 10 
    })
    @IsNotEmpty()
    @IsNumber()
    @IsInt()
    readonly change: number;
}