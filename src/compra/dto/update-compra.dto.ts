// 📄 src/compras/dto/update-compra.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPagoCompraEnum } from '../helpers/metodo-pago-compra.enum'; 
import { UpdateDetalleCompraDto } from './update-detalle-compra.dto'; 

// NO extiende CreateCompraDto ni PartialType(CreateCompraDto) para evitar el error de tipado en 'detalles'.
export class UpdateCompraDto {
    
    @ApiProperty({ description: 'ID del proveedor (opcional)', type: Number, required: false })
    @IsOptional()
    @IsInt({ message: 'El ID del proveedor debe ser un número entero.' })
    idProveedor?: number;

    @ApiProperty({ 
        description: 'Método de pago de la compra (opcional)', 
        enum: MetodoPagoCompraEnum,
        required: false
    })
    @IsOptional()
    @IsEnum(MetodoPagoCompraEnum, { message: 'El método de pago no es válido.' })
    metodoPago?: MetodoPagoCompraEnum;

    // Tipo correcto para anidar DTOs de actualización (UpdateDetalleCompraDto)
    @ApiProperty({ 
        type: [UpdateDetalleCompraDto], 
        description: 'Lista COMPLETA de detalles de compra.', 
        required: false 
    })
    @IsOptional()
    @IsArray({ message: 'Los detalles deben ser un array.' })
    @ValidateNested({ each: true })
    @Type(() => UpdateDetalleCompraDto) 
    detalles?: UpdateDetalleCompraDto[];
}