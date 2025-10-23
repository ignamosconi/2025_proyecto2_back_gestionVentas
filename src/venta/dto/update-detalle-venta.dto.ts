// dto/update-detalle-venta.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateDetalleVentaDto } from './create-detalle-venta.dto';

export class UpdateDetalleVentaDto extends PartialType(CreateDetalleVentaDto) {}
