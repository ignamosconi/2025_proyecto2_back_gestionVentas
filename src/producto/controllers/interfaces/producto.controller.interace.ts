// src/productos/interfaces/producto.controller.interface.ts

import { Producto } from '../../entities/producto.entity';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { UpdateStockDto } from 'src/producto/dto/update-stock.dto';

export interface ProductoControllerInterface {
    
    // US 7: Lectura
    findAll(): Promise<Producto[]>; 
    findOne(id: number): Promise<Producto>;
    
    // US 7 & US 10: Creación/Actualización (Requiere OWNER)
    create(data: CreateProductoDto): Promise<Producto>; 
    update(id: number, data: UpdateProductoDto): Promise<Producto>;
    
    // US 7: Eliminación Lógica (Requiere OWNER)
    softDelete(id: number): Promise<void>; 
    restore(id: number): Promise<void>; 
    
    // US 11: Alerta de Bajo Stock (Requiere OWNER, ya que es gestión de inventario)
    findLowStockProducts(): Promise<Producto[]>; 
    updateStock(idProducto: number, updateStockDto: UpdateStockDto): Promise<Producto>;
}