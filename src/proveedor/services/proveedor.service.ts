// src/proveedores/services/proveedor.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProveedorServiceInterface } from './interfaces/proveedor.service.interface';
import { ProveedorRepositoryInterface } from '../repositories/interfaces/proveedor.repository.interface';
import { Proveedor } from '../entities/proveedor.entity';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { PROVEEDOR_REPOSITORY } from '../../constants';
import { Inject } from '@nestjs/common';

@Injectable()
export class ProveedorService implements ProveedorServiceInterface {
    constructor(
        @Inject(PROVEEDOR_REPOSITORY)
        private readonly proveedorRepository: ProveedorRepositoryInterface,
    ) {}

    findAll(): Promise<Proveedor[]> {
        return this.proveedorRepository.findAll();
    }

    async findOne(id: number): Promise<Proveedor> {
        const proveedor = await this.proveedorRepository.findOne(id);
        if (!proveedor) throw new NotFoundException(`Proveedor ${id} no encontrado`);
        return proveedor;
    }

    create(data: CreateProveedorDto): Promise<Proveedor> {
        return this.proveedorRepository.create(data);
    }

    async update(id: number, data: UpdateProveedorDto): Promise<Proveedor> {
        const proveedor = await this.findOne(id);
        return this.proveedorRepository.update(id, data);
    }

    async softDelete(id: number): Promise<void> {
        const proveedor = await this.findOne(id);
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
