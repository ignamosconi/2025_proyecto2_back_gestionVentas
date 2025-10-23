import { PartialType } from '@nestjs/mapped-types';
import { CreateLineaDto } from './create-linea.dto';

/**
 * Hereda todas las propiedades y validaciones de CreateLineaDto, 
 * pero hace que todas sus propiedades sean opcionales (PartialType).
 */
export class UpdateLineaDto extends PartialType(CreateLineaDto) {}