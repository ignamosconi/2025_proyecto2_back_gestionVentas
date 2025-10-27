import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  direccion: string;

  @IsString()
  telefono: string;
}
