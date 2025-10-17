//ARCHIVO: register-employee-owner.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../helpers/enum.roles';

export class RegisterEmployeeOwnerDTO {
  
  @ApiProperty({ example: 'usuario@example.com', description: 'Correo electrónico del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '+65 9 469 6 242 774', description: 'Número de teléfono del usuario, sin 0 ni 15' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Bv Sarmiento 1540, departamento 3', description: 'Dirección completa del usuario' })
  @IsString()
  @IsNotEmpty()
  address: string;

  // ROLES
  @ApiPropertyOptional({ 
    enum: UserRole, 
    default: UserRole.EMPLOYEE, 
    description: 'Rol del usuario. Solo OWNER puede definir esto.' 
  })
  @IsEnum(UserRole) // Asegura que solo se usen valores del Enum
  @IsOptional() // El rol es opcional; sino lo pasan toma a "Empleado" por defecto
  role?: UserRole;
}
