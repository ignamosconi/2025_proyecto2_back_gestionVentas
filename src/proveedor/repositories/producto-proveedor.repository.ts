// src/proveedores/repositories/producto-proveedor.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductoProveedor } from '../entities/producto-proveedor.entity';
import { CreateProductoProveedorDto } from '../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../dto/update-producto-proveedor.dto';
import { ProductoProveedorRepositoryInterface } from './interfaces/producto-proveedor.repository.interface';

@Injectable()
export class ProductoProveedorRepository implements ProductoProveedorRepositoryInterface {
    private repository: Repository<ProductoProveedor>;

    constructor(private dataSource: DataSource) {
        this.repository = this.dataSource.getRepository(ProductoProveedor);
    }

    async findAll(): Promise<ProductoProveedor[]> {
        return this.repository
            .createQueryBuilder('pp')
            .leftJoinAndSelect('pp.producto', 'producto')
            .leftJoinAndSelect('pp.proveedor', 'proveedor')
            .getMany();
    }

    async findOne(id: number): Promise<ProductoProveedor | null> {
        return this.repository
            .createQueryBuilder('pp')
            .leftJoinAndSelect('pp.producto', 'producto')
            .leftJoinAndSelect('pp.proveedor', 'proveedor')
            .where('pp.idProductoProveedor = :id', { id })
            .getOne();
    }

    async findByProducto(idProducto: number): Promise<ProductoProveedor[]> {
        return this.repository
            .createQueryBuilder('pp')
            .leftJoinAndSelect('pp.producto', 'producto')
            .leftJoinAndSelect('pp.proveedor', 'proveedor')
            .where('pp.idProducto = :idProducto', { idProducto })
            .getMany();
    }

    async findByProveedor(idProveedor: number): Promise<ProductoProveedor[]> {
        return this.repository
            .createQueryBuilder('pp')
            .leftJoinAndSelect('pp.producto', 'producto')
            .leftJoinAndSelect('pp.proveedor', 'proveedor')
            .where('pp.idProveedor = :idProveedor', { idProveedor })
            .getMany();
    }

    async create(data: CreateProductoProveedorDto): Promise<ProductoProveedor> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async update(id: number, data: UpdateProductoProveedorDto): Promise<ProductoProveedor> {
        await this.repository.update(id, data);
        const updated = await this.findOne(id);
        if (!updated) throw new NotFoundException(`ProductoProveedor con id ${id} no encontrado`);
        return updated;
    }

    async softDelete(id: number): Promise<void> {
        const entity = await this.findOne(id);
        if (!entity) throw new NotFoundException(`ProductoProveedor con id ${id} no encontrado`);
        await this.repository.softRemove(entity);
    }

    async restore(id: number): Promise<void> {
        const entity = await this.repository.findOne({ where: { idProductoProveedor: id }, withDeleted: true });
        if (!entity) throw new NotFoundException(`ProductoProveedor con id ${id} no encontrado`);
        await this.repository.recover(entity);
    }
}
