import { VentaResponseDto } from 'src/venta/dto/venta-response.dto';
import { CreateVentaDto } from '../../dto/create-venta.dto';
import { Venta } from '../../entities/venta.entity';
import { UpdateVentaDto } from 'src/venta/dto/update-venta.dto';

export interface VentaControllerInterface {
  findAll(): Promise<VentaResponseDto[]>;
  findOne(id: number): Promise<VentaResponseDto | null>;
  findByUsuario(idUsuario: number): Promise<VentaResponseDto[]>;
  create(
    createVentaDto: CreateVentaDto,
    idUsuario: number,
  ): Promise<VentaResponseDto>;
  update(id: number, updateVentaDto: UpdateVentaDto): Promise<VentaResponseDto>;
}
