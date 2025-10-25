import { CreateProveedorDto } from 'src/proveedor/dto/create-proveedor.dto';
import { Proveedor } from '../../entities/proveedor.entity';
import { UpdateProveedorDto } from 'src/proveedor/dto/update-proveedor.dto';

export interface ProveedorControllerInterface {
  findAll(): Promise<Proveedor[]>;
  findOne(id: number): Promise<Proveedor>;
  findAllSoftDeleted(): Promise<Proveedor[]>;
  create(data: CreateProveedorDto): Promise<Proveedor>;
  update(id: number, data: UpdateProveedorDto): Promise<Proveedor>;
  softDelete(id: number): Promise<void>;
  restore(id: number): Promise<void>;
}
