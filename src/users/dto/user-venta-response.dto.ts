import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserVentaResponseDto {
    @ApiProperty({ description: 'Identificador único del usuario.' })
    @Expose()
    id: number;

    @ApiProperty({ description: 'Correo electrónico del usuario.' })
    @Expose()
    email: string;
}