import { Producto } from '../../entities/producto.entity';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { UpdateStockDto } from 'src/producto/dto/update-stock.dto';

export interface ProductoServiceInterface {
    // CRUD (US 7)
    findAll(): Promise<Producto[]>; 
    findOne(id: number): Promise<Producto>;
    findOneActive(id: number): Promise<Producto>;

    create(data: CreateProductoDto): Promise<Producto>; // Maneja US 10
    createWithImage(data: CreateProductoDto, file?: Express.Multer.File): Promise<Producto>;

    update(idProducto: number, data: UpdateProductoDto): Promise<Producto>;
    updateWithImage(idProducto: number, data: UpdateProductoDto, file?: Express.Multer.File): Promise<Producto>;

    softDelete(idProducto: number): Promise<void>; // US 7: Eliminación Lógica
    restore(idProducto: number): Promise<void>; // US 7: Reversión del Soft-Delete
    
    updateStock(idProducto: number, updateStockDto: UpdateStockDto): Promise<Producto>;
         
    // Alerta de Bajo Stock (US 11)
    findLowStockProducts(): Promise<Producto[]>; 
}
