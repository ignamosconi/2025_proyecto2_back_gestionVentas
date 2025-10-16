import { Producto } from '../../entities/producto.entity';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { DeepPartial } from 'typeorm';

export interface ProductoRepositoryInterface {
    // US 7 (CRUD y Soft-Delete)
    findAllActive(): Promise<Producto[]>; // US 7: Excluye eliminados
    findOneActive(idProducto: number): Promise<Producto | null>; // US 7: Excluye eliminados
    findOneInactive(idProducto: number): Promise<Producto | null>;
    create(data: CreateProductoDto | DeepPartial<Producto>): Promise<Producto>;
    update(idProducto: number, data: UpdateProductoDto): Promise<Producto>;
    softDelete(idProducto: number): Promise<void>; // US 7: Eliminación Lógica
    restore(idProducto: number): Promise<void>; // US 7: Reversión del Soft-Delete

    // US 11 (Alerta de Bajo Stock)
    findLowStockProducts(): Promise<Producto[]>; // US 11: Filtra por stock < alertaStock
    updateStock(idProducto: number, change: number): Promise<Producto>;
}