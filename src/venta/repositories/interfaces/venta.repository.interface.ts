import { Venta } from '../../entities/venta.entity';

export interface VentaRepositoryInterface {
    findAll(): Promise<Venta[]>;
    findOne(id: number): Promise<Venta | null>;
    findByUsuario(idUsuario: number): Promise<Venta[]>;
    create(venta: Venta): Promise<Venta>;
}
