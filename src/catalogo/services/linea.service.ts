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
import { LINEA_REPOSITORY } from '../../constants'; 
import { Linea } from '../entities/linea.entity';
import { CreateLineaDto } from '../dto/create-linea.dto';
import { UpdateLineaDto } from '../dto/update-linea.dto';


// NOTA: Si en el futuro una Línea no se puede eliminar si tiene Productos asociados, 
// aquí se inyectaría un 'ProductosValidatorInterface' (como hicimos con Marca).

@Injectable()
export class LineaService implements LineaServiceInterface {
    constructor(
        @Inject(LINEA_REPOSITORY)
        private readonly lineaRepository: LineaRepositoryInterface
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

// ---------------------------------------------------------------------
// MÉTODOS DE ESCRITURA (CREATE, UPDATE, DELETE, RESTORE)
// ---------------------------------------------------------------------

    /**
     * Crea una nueva línea.
     * Criterio: Valida que el nombre de la línea no exista globalmente.
     */
    async create(data: CreateLineaDto): Promise<Linea> {
        // 1. Lógica de Negocio: Validación de unicidad
        const existingLinea = await this.lineaRepository.findByName(data.nombre);
        if (existingLinea) {
            throw new BadRequestException(`El nombre de línea '${data.nombre}' ya existe en el sistema.`);
        }
        
        // 2. Delegación al repositorio
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
     */
    async softDelete(id: number): Promise<void> {
        // [FUTURA VALIDACIÓN] Aquí iría la validación si la línea tiene productos asociados.
        
        // 1. Aseguramos que la línea exista y esté activa antes de intentar eliminar
        await this.findOneActive(id); 

        // 2. Delegación al repositorio
        await this.lineaRepository.softDelete(id);
    }
    
    /**
     * Restaura una línea previamente eliminada suavemente.
     */
    async restore(id: number): Promise<void> {
        await this.lineaRepository.restore(id);
    }
}