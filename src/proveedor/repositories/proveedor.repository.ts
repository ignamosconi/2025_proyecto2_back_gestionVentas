// src/proveedores/repositories/proveedor.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Proveedor } from '../entities/proveedor.entity';
import { ProveedorRepositoryInterface } from './interfaces/proveedor.repository.interface';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';

@Injectable()
export class ProveedorRepository implements ProveedorRepositoryInterface {
    private readonly repo: Repository<Proveedor>;

    constructor(private readonly dataSource: DataSource) {
        this.repo = dataSource.getRepository(Proveedor);
    }

    async findAll(): Promise<Proveedor[]> {
<<<<<<< HEAD
        return this.repo.find();
=======
        return this.repo.find({ where: { deletedAt: IsNull() } });
    }

    async findAllSoftDeleted(): Promise<Proveedor[]> {
        return this.repo.find({ withDeleted: true, where: { deletedAt: Not(IsNull()) } });
>>>>>>> 8b25e988cc6ecdcd3917d8dff1250fb8218f1182
    }

    async findOne(id: number): Promise<Proveedor> {
        const proveedor = await this.repo.findOne({ where: { idProveedor: id } });
        if (!proveedor) {
            throw new NotFoundException(`Proveedor con id ${id} no encontrado`);
        }
        return proveedor;
    }

    async findByNombreActive(nombre: string): Promise<Proveedor | null> {
        return this.repo.findOne({ 
            where: { 
                nombre, 
                deletedAt: IsNull() 
            } 
        });
    }

<<<<<<< HEAD
=======

>>>>>>> 8b25e988cc6ecdcd3917d8dff1250fb8218f1182
    async create(data: CreateProveedorDto): Promise<Proveedor> {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }

    async update(id: number, data: UpdateProveedorDto): Promise<Proveedor> {
        const proveedor = await this.repo.findOne({ where: { idProveedor: id } });
        if (!proveedor) {
            throw new NotFoundException(`Proveedor con id ${id} no encontrado para actualizar`);
        }

        const entityToUpdate = this.repo.merge(proveedor, data);
        return this.repo.save(entityToUpdate);
    }

    async softDelete(id: number): Promise<void> {
        const proveedor = await this.repo.findOne({ where: { idProveedor: id } });
        if (!proveedor) {
            throw new NotFoundException(`Proveedor con id ${id} no encontrado para eliminar`);
        }

        await this.repo.softDelete(id);
    }

    async restore(id: number): Promise<void> {
        const proveedor = await this.repo.findOne({ where: { idProveedor: id }, withDeleted: true });
        if (!proveedor) {
            throw new NotFoundException(`Proveedor con id ${id} no encontrado para restaurar`);
        }

        await this.repo.restore(id);
    }
}
