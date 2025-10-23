import { ProductoProveedor } from '../../entities/producto-proveedor.entity';
import { CreateProductoProveedorDto } from '../../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../../dto/update-producto-proveedor.dto';

export interface ProductoProveedorRepositoryInterface {
    findAll(): Promise<ProductoProveedor[]>;
    findAllSoftDeleted(): Promise<ProductoProveedor[]>;
    findOne(id: number): Promise<ProductoProveedor | null>;
    findByProducto(idProducto: number): Promise<ProductoProveedor[]>;
    findByProveedor(idProveedor: number): Promise<ProductoProveedor[]>;
    findExistingRelation(idProducto: number, idProveedor: number): Promise<ProductoProveedor | null>;
    create(data: CreateProductoProveedorDto): Promise<ProductoProveedor>;
    update(id: number, data: UpdateProductoProveedorDto): Promise<ProductoProveedor>;
    softDelete(id: number): Promise<void>;
    restore(id: number): Promise<void>;
}
