// src/productos/repositories/producto.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, DeepPartial, IsNull, Not } from 'typeorm';
import { Producto } from '../entities/producto.entity';
import { ProductoRepositoryInterface } from './interfaces/producto-interface.repository';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { CreateProductoDto } from '../dto/create-producto.dto';

@Injectable()
export class ProductoRepository implements ProductoRepositoryInterface {
    private repository: Repository<Producto>;

    // US 11: Constante para la consulta de bajo stock
    private readonly ALERTA_STOCK_QUERY = 'producto.stock < producto.alertaStock'; 

    constructor(private dataSource: DataSource) {
        this.repository = this.dataSource.getRepository(Producto);
    }

    // ---------------------------------------------------------------------
    // CONSULTAS (US 7, US 11)
    // ---------------------------------------------------------------------

    async findAllActive(): Promise<Producto[]> {
        // Por defecto, find() excluye los registros soft-deleted
        return this.repository.find({
            relations: ['linea', 'marca'], 
        });
    }
    
    async findOneActive(idProducto: number): Promise<Producto | null> {
        return this.repository.findOne({ 
            where: { idProducto, deletedAt: IsNull() },
            relations: ['linea', 'marca'],
        });
    }

    async findOneInactive(idProducto: number): Promise<Producto | null> {
        return this.repository.findOne({
            where: { idProducto, deletedAt: Not(IsNull()) },
            withDeleted: true,
            relations: ['linea', 'marca'],
        });
    }

    async findLowStockProducts(): Promise<Producto[]> {
        // US 11: Implementación con QueryBuilder
        return this.repository
            .createQueryBuilder('producto')
            .where('producto.deletedAt IS NULL') 
            .andWhere(this.ALERTA_STOCK_QUERY) 
            .getMany();
    }
    
    // ---------------------------------------------------------------------
    // ESCRITURA (US 7)
    // ---------------------------------------------------------------------

    async create(data: CreateProductoDto | DeepPartial<Producto>): Promise<Producto> {
        // Acepta el DTO o el DeepPartial<Producto> limpio y validado del servicio.
        const newProducto = this.repository.create(data as DeepPartial<Producto>);
        return this.repository.save(newProducto);
        // Si hay error de FK (p. ej., idMarca o idLinea no existe), TypeORM lo lanza.
    }

    async update(idProducto: number, data: UpdateProductoDto): Promise<Producto> {
        const result = await this.repository.update(idProducto, data);

        if (result.affected === 0) {
            throw new NotFoundException(`No se pudo actualizar el producto con ID ${idProducto} porque no existe.`);
        }
        // Devuelve el objeto completo actualizado
        const updatedProducto = await this.findOneActive(idProducto);
        if (!updatedProducto) {
            throw new NotFoundException(`Producto con ID ${idProducto} no encontrado después de la actualización.`);
        }
        return updatedProducto;
    }
    
    // ---------------------------------------------------------------------
    // SOFT DELETE (US 7)
    // ---------------------------------------------------------------------
    
    async softDelete(idProducto: number): Promise<void> {
        const result = await this.repository.softDelete(idProducto);
        if (result.affected === 0) {
            throw new NotFoundException(`Producto con ID ${idProducto} no encontrado o ya estaba eliminado lógicamente.`);
        }
    }

    async restore(idProducto: number): Promise<void> {
        const result = await this.repository.restore(idProducto);
        if (result.affected === 0) {
            throw new NotFoundException(`Producto con ID ${idProducto} no encontrado o no estaba eliminado lógicamente.`);
        }
    }

    async updateStock(idProducto: number, change: number): Promise<Producto> {
        // 1️⃣ Buscar el producto activo (no eliminado)
        const producto = await this.findOneActive(idProducto);
        if (!producto) {
            throw new NotFoundException(`Producto con ID ${idProducto} no encontrado o eliminado.`);
        }

        // 2️⃣ Calcular el nuevo stock
        const nuevoStock = producto.stock + change;

        // 3️⃣ Actualizar el valor en el producto
        producto.stock = nuevoStock;

        // 4️⃣ Guardar en la base de datos
        await this.repository.save(producto);

        // 5️⃣ Registrar advertencia si queda en negativo (opcional)
        if (nuevoStock < 0) {
            console.warn(`⚠️ El producto ID ${idProducto} quedó con stock negativo (${nuevoStock}).`);
        }

        // 6️⃣ Devolver el producto actualizado
        return producto;
    }

    
    
}