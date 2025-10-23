// src/catalogo/repositories/marca-linea.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, IsNull, Not, Repository } from 'typeorm';

import { MarcaLinea } from '../entities/marca-linea.entity';
import { Linea } from '../entities/linea.entity'; // Necesario para la unión
import { CreateMarcaLineaDto } from '../dto/create-marca-linea.dto';
import { MarcaLineaRepositoryInterface } from './interfaces/marca-linea.repository.interface';

@Injectable()
export class MarcaLineaRepository implements MarcaLineaRepositoryInterface {
    private repository: Repository<MarcaLinea>;

    constructor(private dataSource: DataSource) {
        this.repository = this.dataSource.getRepository(MarcaLinea);
    }

    // --- Implementación de Métodos ---

    async create(data: CreateMarcaLineaDto): Promise<MarcaLinea> {
        // TypeORM maneja la inserción de la clave compuesta
        const marcaLinea = this.repository.create(data);
        return this.repository.save(marcaLinea);
    }

    async softDelete(marcaId: number, lineaId: number): Promise<void> {
        const entity = await this.repository.findOneBy({ marcaId, lineaId });

        if (!entity) {
            throw new NotFoundException(`Vínculo Marca ID ${marcaId} - Línea ID ${lineaId} no encontrado.`);
        }

        await this.repository.softRemove(entity);
    }
    
    async restore(marcaId: number, lineaId: number): Promise<void> {
        const result = await this.repository.restore({ marcaId, lineaId });
        
        if (result.affected === 0) {
            throw new NotFoundException(`Vínculo Marca ID ${marcaId} - Línea ID ${lineaId} no encontrado para restaurar.`);
        }
    }
    
    async findOneByIds(marcaId: number, lineaId: number, includeDeleted: boolean = false): Promise<MarcaLinea | null> {
        return this.repository.findOne({
            where: { marcaId, lineaId },
            withDeleted: includeDeleted
        });
    }

    async findAllActive(): Promise<MarcaLinea[]> {
        return this.repository.find({
            where: {},
            relations: ['marca', 'linea'],
        });
    }

    async findAllDeleted(): Promise<MarcaLinea[]> {
        return this.repository.find({
            withDeleted: true,
            where: {
                deletedAt: Not(IsNull()),
            },
            relations: ['marca', 'linea'],
        });
    }

    async findLineaByNameForMarca(marcaId: number, nombreLinea: string): Promise<MarcaLinea | null> {
        // Lógica de búsqueda con JOIN para la restricción de negocio:
        // Buscamos un registro en MarcaLinea que tenga el idMarca dado Y que su Linea asociada 
        // tenga el nombre específico (ej. 'Zapatillas').
        
        const alias = 'ml'; // Alias para MarcaLinea
        
        const marcaLinea = await this.repository.createQueryBuilder(alias)
            // Unir MarcaLinea con la entidad Linea
            .innerJoin(Linea, 'l', `${alias}.lineaId = l.id`)
            // Filtrar por el ID de la Marca
            .where(`${alias}.marcaId = :marcaId`, { marcaId })
            // Filtrar por el nombre de la Línea
            .andWhere(`LOWER(l.nombre) = LOWER(:nombreLinea)`, { nombreLinea })
            .getOne();
            
        return marcaLinea;
    }

    async findAllByMarcaId(marcaId: number): Promise<MarcaLinea[]> {
        return this.repository.find({
            where: {
                marcaId: marcaId,
            },
            // Opcional: Carga las entidades de relación si quieres ver los nombres de las líneas
            relations: ['linea'], 
        });
    }
}