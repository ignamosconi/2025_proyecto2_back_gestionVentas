import { CreateProductoProveedorDto } from "src/proveedor/dto/create-producto-proveedor.dto";
import { UpdateProductoProveedorDto } from "src/proveedor/dto/update-producto-proveedor.dto";
import { ProductoProveedor } from "src/proveedor/entities/producto-proveedor.entity";

export interface ProductoProveedorControllerInterface {
    findAll(): Promise<ProductoProveedor[]>;
    findOne(id: number): Promise<ProductoProveedor>;
    findByProducto(idProducto: number): Promise<ProductoProveedor[]>;
    findByProveedor(idProveedor: number): Promise<ProductoProveedor[]>;
    create(data: CreateProductoProveedorDto): Promise<ProductoProveedor>;
    update(id: number, data: UpdateProductoProveedorDto): Promise<ProductoProveedor>;
    delete(id: number): Promise<void>;
    restore(id: number): Promise<void>;
}
