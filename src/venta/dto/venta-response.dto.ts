import { Expose, Transform, Type } from 'class-transformer';
import { DetalleVentaResponseDto } from './detalle-venta-response.dto';
import { UserVentaResponseDto } from 'src/users/dto/user-venta-response.dto';

export class VentaResponseDto {
    // ID
    @Expose()
    idVenta: number;
    
    // CAMPOS PRINCIPALES
    @Expose()
    fechaCreacion: Date;
    
    @Expose()
    metodoPago: string;
    
    @Expose()
    total: number;

    // RELACIÓN: USUARIO
    // Usamos @Type() para que class-transformer sepa que debe mapear a UserResponseDto
    @Type(() => UserVentaResponseDto)
    @Expose()
    usuario: UserVentaResponseDto;
    
    // RELACIÓN: DETALLES DE VENTA
    // Usamos @Type() y un array del DTO anidado
    @Type(() => DetalleVentaResponseDto)
    @Expose()
    detalles: DetalleVentaResponseDto[];

    // NOTA CLAVE: Aquí solo incluimos propiedades con @Expose(). 
    // Como DetalleVentaResponseDto NO incluirá la propiedad 'venta', el ciclo se rompe.
}