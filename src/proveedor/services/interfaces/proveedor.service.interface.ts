import { Proveedor } from '../../entities/proveedor.entity';
import { CreateProveedorDto } from '../../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../../dto/update-proveedor.dto';

export interface ProveedorServiceInterface {
    findAll(): Promise<Proveedor[]>;
    findOne(idProveedor: number): Promise<Proveedor>;
    findOneActive(id: number): Promise<Proveedor>;
    create(dto: CreateProveedorDto): Promise<Proveedor>;
    update(idProveedor: number, dto: UpdateProveedorDto): Promise<Proveedor>;
    softDelete(id: number): Promise<void>;
    restore(id: number): Promise<void>;
}
