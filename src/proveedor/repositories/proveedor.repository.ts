// src/proveedores/repositories/proveedor.repository.ts
import { Injectable } from '@nestjs/common';
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
        return this.repo.find({ where: { deletedAt: IsNull() } });
    }

    async findAllSoftDeleted(): Promise<Proveedor[]> {
        return this.repo.find({ withDeleted: true, where: { deletedAt: Not(IsNull()) } });
    }

    async findOne(id: number): Promise<Proveedor> {
        const proveedor = await this.repo.findOne({ where: { idProveedor: id } });
        if (!proveedor) {
            throw new Error(`Proveedor con id ${id} no encontrado`);
        }
        return proveedor;
    }


    async create(data: CreateProveedorDto): Promise<Proveedor> {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }

    async update(id: number, data: UpdateProveedorDto): Promise<Proveedor> {
        return this.repo.save({ idProveedor: id, ...data });
    }

    async softDelete(id: number): Promise<void> {
        await this.repo.softDelete(id);
    }

    async restore(id: number): Promise<void> {
        await this.repo.restore(id);
    }
}
