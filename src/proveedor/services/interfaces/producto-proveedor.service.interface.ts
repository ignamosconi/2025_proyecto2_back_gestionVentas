import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { CreateProductoProveedorDto } from '../../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../../dto/update-producto-proveedor.dto';
import { ProductoProveedor } from '../../entities/producto-proveedor.entity';

export interface ProductoProveedorServiceInterface {
  findAll(): Promise<ProductoProveedor[]>;
  findAllSoftDeleted(): Promise<ProductoProveedor[]>;
  findOne(id: number): Promise<ProductoProveedor>;
  findByProducto(idProducto: number): Promise<ProductoProveedor[]>;
  findByProveedor(idProveedor: number): Promise<ProductoProveedor[]>;
  checkLinkExists(
    idProducto: number,
    idProveedor: number,
  ): Promise<ProductoProveedor | null>;
  create(data: CreateProductoProveedorDto): Promise<ProductoProveedor>;
  update(
    id: number,
    data: UpdateProductoProveedorDto,
  ): Promise<ProductoProveedor>;
  softDelete(id: number): Promise<void>;
  restore(id: number): Promise<void>;
}
