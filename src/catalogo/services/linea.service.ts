// src/catalogo/services/linea.service.ts

import { 
    Injectable, 
    Inject, 
    BadRequestException, 
    NotFoundException,
    ConflictException,
} from '@nestjs/common';

import { LineaServiceInterface } from './interfaces/linea.service.interface';
import { LineaRepositoryInterface } from '../repositories/interfaces/linea.repository.interface';
import { MarcaLineaRepositoryInterface } from '../repositories/interfaces/marca-linea.repository.interface';
import { ProductoRepositoryInterface } from '../../producto/repositories/interfaces/producto-interface.repository';
import { LINEA_REPOSITORY, MARCA_LINEA_REPOSITORY, PRODUCTO_REPOSITORY } from '../../constants'; 
import { Linea } from '../entities/linea.entity';
import { CreateLineaDto } from '../dto/create-linea.dto';
import { UpdateLineaDto } from '../dto/update-linea.dto';


// NOTA: Si en el futuro una Línea no se puede eliminar si tiene Productos asociados, 
// aquí se inyectaría un 'ProductosValidatorInterface' (como hicimos con Marca).

@Injectable()
export class LineaService implements LineaServiceInterface {
    constructor(
        @Inject(LINEA_REPOSITORY)
        private readonly lineaRepository: LineaRepositoryInterface,
        
        @Inject(MARCA_LINEA_REPOSITORY)
        private readonly marcaLineaRepository: MarcaLineaRepositoryInterface,
        
        @Inject(PRODUCTO_REPOSITORY)
        private readonly productoRepository: ProductoRepositoryInterface,
    ) {}

// ---------------------------------------------------------------------
// MÉTODOS DE LECTURA (READ)
// ---------------------------------------------------------------------

    async findAll(): Promise<Linea[]> {
        return this.lineaRepository.findAllActive();
    }
    
    async findOneActive(id: number): Promise<Linea> {
        const linea = await this.lineaRepository.findOneActive(id);
        if (!linea) {
            throw new NotFoundException(`Línea con ID ${id} no encontrada o está eliminada.`);
        }
        return linea;
    }

    async findAllSoftDeleted(): Promise<Linea[]> {
        return this.lineaRepository.findAllSoftDeleted();
    }


// ---------------------------------------------------------------------
// MÉTODOS DE ESCRITURA (CREATE, UPDATE, DELETE, RESTORE)
// ---------------------------------------------------------------------

    /**
     * Crea una nueva línea.
     * Criterio: Valida que el nombre de la línea no exista entre las líneas activas.
     * Si existe una línea eliminada con el mismo nombre, primero la restaura.
     */
    async create(data: CreateLineaDto): Promise<Linea> {
        // 1. Lógica de Negocio: Validación de unicidad entre líneas activas
        const existingActiveLinea = await this.lineaRepository.findByName(data.nombre);
        if (existingActiveLinea) {
            throw new BadRequestException(`El nombre de línea '${data.nombre}' ya existe en el sistema.`);
        }
        
        // 2. Verificar si existe una línea eliminada con el mismo nombre
        const existingDeletedLinea = await this.lineaRepository.findByName(data.nombre, true);
        if (existingDeletedLinea && existingDeletedLinea.deletedAt) {
            // Si existe una línea eliminada con el mismo nombre, la restauramos
            await this.lineaRepository.restore(existingDeletedLinea.id);
            // Y la actualizamos con los nuevos datos si hay cambios adicionales
            return this.lineaRepository.update(existingDeletedLinea.id, data);
        }
        
        // 3. Delegación al repositorio para crear una nueva línea
        return this.lineaRepository.create(data);
    }

    /**
     * Actualiza los datos de una línea existente.
     * Criterio: Valida la unicidad si se intenta cambiar el nombre.
     */
    async update(id: number, data: UpdateLineaDto): Promise<Linea> {
        // 1. Lógica de Negocio: Validación de unicidad durante la actualización
        if (data.nombre) {
            const existingLinea = await this.lineaRepository.findByName(data.nombre);
            
            // Si encuentra otra línea con el mismo nombre y el ID es diferente
            if (existingLinea && existingLinea.id !== id) {
                throw new BadRequestException(`El nombre de línea '${data.nombre}' ya está siendo usado por otra línea.`);
            }
        }
        
        // 2. Delegación de la actualización al repositorio.
        // El repositorio manejará la excepción NotFound si el ID no existe.
        return this.lineaRepository.update(id, data);
    }
    
    /**
     * Realiza la eliminación suave de la línea.
     * RESTRICCIÓN 1: IMPEDIR ELIMINACIÓN si hay marcas asociadas.
     * RESTRICCIÓN 2: IMPEDIR ELIMINACIÓN si hay productos asociados.
     * También elimina (soft delete) todas las relaciones marcaLinea asociadas.
     */
    async softDelete(id: number): Promise<void> {
        // 1. Aseguramos que la línea exista y esté activa antes de intentar eliminar
        await this.findOneActive(id); 

        // 2. Lógica de Negocio: Verificar dependencia de marcas
        const hasMarcas = await this.marcaLineaRepository.hasMarcasByLineaId(id);

        if (hasMarcas) {
            // Lanza 409 Conflict si la línea tiene marcas asociadas
            throw new ConflictException(
                `No se puede eliminar la línea con ID ${id} porque tiene marcas asociadas. Debe desvincular las marcas primero.`
            );
        }

        // 3. Lógica de Negocio: Verificar dependencia de productos
        const hasProducts = await this.productoRepository.hasProductsByLineaId(id);

        if (hasProducts) {
            // Lanza 409 Conflict si la línea tiene dependencias activas
            throw new ConflictException(
                `No se puede eliminar la línea con ID ${id} porque tiene productos asociados. Debe desvincular los productos primero.`
            );
        }

        // 4. Eliminar todas las relaciones marcaLinea asociadas a esta línea (por si acaso)
        await this.marcaLineaRepository.softDeleteAllByLineaId(id);

        // 5. Delegación al repositorio para eliminar la línea
        await this.lineaRepository.softDelete(id);
    }
    
    /**
     * Restaura una línea previamente eliminada suavemente.
     */
    async restore(id: number): Promise<void> {
        await this.lineaRepository.restore(id);
    }
}