import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../helpers/enum.roles';

export class UpdateUserDTO {
  @ApiPropertyOptional({
    example: 'nuevoemail@example.com',
    description: 'Nuevo correo electrónico del usuario',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'NuevaPassword123!',
    description: 'Nueva contraseña del usuario',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    example: 'Carlos',
    description: 'Nuevo nombre del usuario',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Gómez',
    description: 'Nuevo apellido del usuario',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: '+54 9 11 1234-5678',
    description: 'Nuevo teléfono del usuario',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Calle Falsa 123',
    description: 'Nueva dirección del usuario',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Empleado',
    enum: UserRole,
    description: 'Nuevo rol del usuario',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser "Dueño" o "Empleado"' })
  role?: UserRole; //El atributo "role" es opcional, pero si envían solo puede ser UserRole
}
