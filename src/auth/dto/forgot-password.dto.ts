//ARCHIVO: forgot-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDTO {
  @ApiProperty({ example: 'usuario@mail.com' })
  @IsEmail()
  email: string;
}
