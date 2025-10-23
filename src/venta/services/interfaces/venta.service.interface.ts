import { CreateVentaDto } from "src/venta/dto/create-venta.dto";
import { UpdateVentaDto } from "src/venta/dto/update-venta.dto";
import { VentaResponseDto } from "src/venta/dto/venta-response.dto";
import { Venta } from "src/venta/entities/venta.entity";


export interface VentaServiceInterface {
    findAll(): Promise<VentaResponseDto[]>;
    findOne(id: number): Promise<VentaResponseDto | null>;
    findByUsuario(idUsuario: number): Promise<VentaResponseDto[]>;
    create(data: CreateVentaDto, idUsuarioCreador: number): Promise<VentaResponseDto>;
    update(id: number, updateVentaDto: UpdateVentaDto): Promise<VentaResponseDto>;
}
