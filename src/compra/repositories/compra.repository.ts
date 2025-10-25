import { Injectable } from '@nestjs/common';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { CompraRepositoryInterface } from './interfaces/compra.repository.interface';
import { Compra } from '../entities/compra.entity';
import { DetalleCompra } from '../entities/detalle-compra.entity';

@Injectable()
export class CompraRepository implements CompraRepositoryInterface {
    
    private repository: Repository<Compra>;
    private detalleRepository: Repository<DetalleCompra>; 

    constructor(private dataSource: DataSource) {
        this.repository = this.dataSource.getRepository(Compra);
        this.detalleRepository = this.dataSource.getRepository(DetalleCompra); 
    }

    // ---------------------------------------------------------------------
    // MÉTODOS DE LECTURA (FIND)
    // ---------------------------------------------------------------------

    async findAll(): Promise<Compra[]> {
        return this.repository.find({
            // Ajuste de relaciones: detalles, producto, proveedor, usuario
            relations: ['detalles', 'detalles.producto', 'proveedor', 'usuario'],
            order: { fechaCreacion: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Compra | null> {
        return this.repository.findOne({
            where: { idCompra: id } as any, // Asumimos idCompra es el PK
            relations: ['detalles', 'detalles.producto', 'proveedor', 'usuario'],
        });
    }

    async findByUsuario(idUsuario: number): Promise<Compra[]> {
        return this.repository.find({
            // Busca por el ID del usuario que registró la compra
            where: { usuario: { id: idUsuario } } as any, 
            relations: ['detalles', 'detalles.producto', 'proveedor', 'usuario'],
            order: { fechaCreacion: 'DESC' },
        });
    }

    // ---------------------------------------------------------------------
    // MÉTODOS DE ESCRITURA (SAVE/UPDATE)
    // ---------------------------------------------------------------------
    
    // Crear una compra (recibe la entidad lista del service)
    async save(compra: Compra): Promise<Compra> {
        const entity = this.repository.create(compra);
        return this.repository.save(entity);
    }

    async updateCompra(id: number, compra: Compra): Promise<Compra | null> {
        // Usa .update() para la cabecera
        await this.repository.update(id, compra);
        
        // Retorna la entidad recargada con relaciones
        return this.repository.findOne({
            where: { idCompra: id } as any,
            relations: ['usuario', 'proveedor', 'detalles', 'detalles.producto'],
        });
    }

    // ---------------------------------------------------------------------
    // MÉTODOS AUXILIARES PARA TRANSACCIONES
    // ---------------------------------------------------------------------

    getQueryRunner(): QueryRunner {
        // Necesario para gestionar las transacciones de stock en el Service
        return this.dataSource.createQueryRunner();
    }
  
    async removeDetallesInTransaction(detalles: DetalleCompra[], queryRunner: QueryRunner): Promise<void> {
        if (detalles.length === 0) return;
        
        // Ejecuta la eliminación dentro del contexto transaccional (del manager del QueryRunner)
        await queryRunner.manager.remove(detalles);
    }
}