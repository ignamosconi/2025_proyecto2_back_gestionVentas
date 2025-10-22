import { CreateVentaDto } from "src/venta/dto/create-venta.dto";
import { Venta } from "src/venta/entities/venta.entity";


export interface VentaServiceInterface {
    findAll(): Promise<Venta[]>;
    findOne(id: number): Promise<Venta | null>;
    findByUsuario(idUsuario: number): Promise<Venta[]>;
    create(data: CreateVentaDto, idUsuarioCreador: number): Promise<Venta>; //se asgina automàticamente quien crea la venta
}
