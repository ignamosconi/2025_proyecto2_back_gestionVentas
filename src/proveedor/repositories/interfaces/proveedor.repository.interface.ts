import { Proveedor } from '../../entities/proveedor.entity';
import { CreateProveedorDto } from '../../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../../dto/update-proveedor.dto';

export interface ProveedorRepositoryInterface {
    findAll(): Promise<Proveedor[]>;
    findAllSoftDeleted(): Promise<Proveedor[]>;
    findOne(idProveedor: number): Promise<Proveedor | null>;
    findByNombreActive(nombre: string): Promise<Proveedor | null>;
    create(dto: CreateProveedorDto): Promise<Proveedor>;
    update(idProveedor: number, dto: UpdateProveedorDto): Promise<Proveedor>;
    softDelete(id: number): Promise<void>;
    restore(id: number): Promise<void>;
}
