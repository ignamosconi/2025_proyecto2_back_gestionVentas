// src/proveedores/services/proveedor.service.ts
import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { ProveedorServiceInterface } from './interfaces/proveedor.service.interface';
import { ProveedorRepositoryInterface } from '../repositories/interfaces/proveedor.repository.interface';
import { ProductoProveedorRepositoryInterface } from '../repositories/interfaces/producto-proveedor.repository.interface';
import { Proveedor } from '../entities/proveedor.entity';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { PROVEEDOR_REPOSITORY, PRODUCTO_PROVEEDOR_REPOSITORY } from '../../constants';

@Injectable()
export class ProveedorService implements ProveedorServiceInterface {
    constructor(
        @Inject(PROVEEDOR_REPOSITORY)
        private readonly proveedorRepository: ProveedorRepositoryInterface,
        @Inject(PRODUCTO_PROVEEDOR_REPOSITORY)
        private readonly productoProveedorRepository: ProductoProveedorRepositoryInterface,
    ) {}

    findAll(): Promise<Proveedor[]> {
        return this.proveedorRepository.findAll();
    }

    async findOne(id: number): Promise<Proveedor> {
        const proveedor = await this.proveedorRepository.findOne(id);
        if (!proveedor) throw new NotFoundException(`Proveedor ${id} no encontrado`);
        return proveedor;
    }

    findAllSoftDeleted(): Promise<Proveedor[]> {
        return this.proveedorRepository.findAllSoftDeleted();
    }

    async create(data: CreateProveedorDto): Promise<Proveedor> {
        // Verificar si ya existe un proveedor activo con ese nombre
        const existingProveedor = await this.proveedorRepository.findByNombreActive(data.nombre);
        if (existingProveedor) {
            throw new ConflictException('Ya existe un proveedor con ese nombre');
        }

        try {
            return await this.proveedorRepository.create(data);
        } catch (error) {
            if (error.code === '23505' || error.detail?.includes('already exists')) {
                throw new ConflictException('Ya existe un proveedor con ese nombre');
            }
            throw error;
        }
    }

    async update(id: number, data: UpdateProveedorDto): Promise<Proveedor> {
        const proveedor = await this.findOne(id);
        
        // Si se está actualizando el nombre, verificar que no exista otro proveedor activo con ese nombre
        if (data.nombre && data.nombre !== proveedor.nombre) {
            const existingProveedor = await this.proveedorRepository.findByNombreActive(data.nombre);
            if (existingProveedor && existingProveedor.idProveedor !== id) {
                throw new ConflictException('Ya existe un proveedor con ese nombre');
            }
        }

        try {
            return await this.proveedorRepository.update(id, data);
        } catch (error) {
            if (error.code === '23505' || error.detail?.includes('already exists')) {
                throw new ConflictException('Ya existe un proveedor con ese nombre');
            }
            throw error;
        }
    }

    async softDelete(id: number): Promise<void> {
        const proveedor = await this.findOne(id);
        
        // Obtener todas las relaciones producto-proveedor activas
        const relaciones = await this.productoProveedorRepository.findByProveedor(id);
        
        // Eliminar (soft delete) todas las relaciones
        for (const relacion of relaciones) {
            await this.productoProveedorRepository.softDelete(relacion.idProductoProveedor);
        }
        
        // Finalmente, eliminar el proveedor
        await this.proveedorRepository.softDelete(id);
    }

    async restore(id: number): Promise<void> {
        await this.proveedorRepository.restore(id);
    }

    async findOneActive(id: number): Promise<Proveedor> {
        const proveedor = await this.findOne(id);
        if (!proveedor || proveedor.deletedAt) throw new NotFoundException(`Proveedor con id ${id} no encontrado o eliminado`);
        return proveedor;
    }
}
