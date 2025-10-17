// src/proveedores/services/producto-proveedor.service.ts
import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductoProveedorServiceInterface } from './interfaces/producto-proveedor.service.interface';
import { ProductoProveedorRepositoryInterface } from '../repositories/interfaces/producto-proveedor.repository.interface';
import { PRODUCTO_PROVEEDOR_REPOSITORY } from '../../constants';
import { ProductoProveedor } from '../entities/producto-proveedor.entity';
import { CreateProductoProveedorDto } from '../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../dto/update-producto-proveedor.dto';
import { ProductoServiceInterface } from 'src/producto/services/interfaces/producto.service.interface';
import { ProveedorServiceInterface } from './interfaces/proveedor.service.interface';
import { PRODUCTO_SERVICE, PROVEEDOR_SERVICE } from '../../constants';

@Injectable()
export class ProductoProveedorService implements ProductoProveedorServiceInterface {
    constructor(
        @Inject(PRODUCTO_PROVEEDOR_REPOSITORY)
        private readonly productoProveedorRepo: ProductoProveedorRepositoryInterface,
        @Inject(PRODUCTO_SERVICE)
        private readonly productoService: ProductoServiceInterface,
        @Inject(PROVEEDOR_SERVICE)
        private readonly proveedorService: ProveedorServiceInterface,
    ) {}

    async findAll(): Promise<ProductoProveedor[]> {
        return this.productoProveedorRepo.findAll();
    }

    async findOne(id: number): Promise<ProductoProveedor> {
        const entity = await this.productoProveedorRepo.findOne(id);
        if (!entity) throw new NotFoundException(`ProductoProveedor con id ${id} no encontrado`);
        return entity;
    }

    async findByProducto(idProducto: number): Promise<ProductoProveedor[]> {
        return this.productoProveedorRepo.findByProducto(idProducto);
    }

    async findByProveedor(idProveedor: number): Promise<ProductoProveedor[]> {
        return this.productoProveedorRepo.findByProveedor(idProveedor);
    }

    async create(data: CreateProductoProveedorDto): Promise<ProductoProveedor> {
        // 1. Validar existencia de producto y proveedor
        await Promise.all([
            this.productoService.findOneActive(data.idProducto),
            this.proveedorService.findOneActive(data.idProveedor),
        ]);

        // 2. Validar duplicados (busca si ya existe un vínculo con el mismo proveedor para este producto)
        const existing = await this.productoProveedorRepo.findByProducto(data.idProducto);
        if (existing.some(v => v.idProveedor === data.idProveedor)) {
             // Utilizar idProveedor de la entidad para la verificación de duplicados
            throw new ConflictException(`El proveedor ya está vinculado a este producto`);
        }

        // 3. Crear el objeto de la Entidad con el mapeo correcto
        const entityToCreate = {
            // CORRECCIÓN CLAVE: Mapear 'productoId' y 'proveedorId' del DTO a 
            // 'idProducto' e 'idProveedor' de la entidad (columnas FK).
            idProducto: data.idProducto,
            idProveedor: data.idProveedor,
            codigoProveedor: data.codigoProveedor
            // NOTA: Las propiedades de relación 'producto' y 'proveedor' no se incluyen aquí.
        };

        // 4. Crear el vínculo en el repositorio
        // Usamos 'any' en el casting ya que TypeORM espera el nombre de la FK.
        return this.productoProveedorRepo.create(entityToCreate as any); 
    }

    async update(id: number, data: UpdateProductoProveedorDto): Promise<ProductoProveedor> {
        const entity = await this.findOne(id);
        return this.productoProveedorRepo.update(id, { ...entity, ...data });
    }

    async softDelete(id: number): Promise<void> {
        const entity = await this.findOne(id);
        await this.productoProveedorRepo.softDelete(entity.idProductoProveedor);
    }

    async restore(id: number): Promise<void> {
        await this.productoProveedorRepo.restore(id);
    }
}
