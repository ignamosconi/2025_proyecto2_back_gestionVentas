import { CreateVentaDto } from '../../dto/create-venta.dto';
import { Venta } from '../../entities/venta.entity';

export interface VentaControllerInterface {
    findAll(): Promise<Venta[]>;
    findOne(id: number): Promise<Venta | null>;
    findByUsuario(idUsuario: number): Promise<Venta[]>;
    create(createVentaDto: CreateVentaDto, idUsuario: number): Promise<Venta>;
}
