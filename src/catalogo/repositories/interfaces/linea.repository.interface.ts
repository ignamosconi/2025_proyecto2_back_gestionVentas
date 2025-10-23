// src/catalogo/interfaces/linea.repository.interface.ts

import { Linea } from '../../entities/linea.entity';
import { CreateLineaDto } from '../../dto/create-linea.dto';
import { UpdateLineaDto } from '../../dto/update-linea.dto';

export interface LineaRepositoryInterface {
    /**
     * Crea y guarda una nueva línea.
     */
    create(data: CreateLineaDto): Promise<Linea>;
    
    /**
     * Actualiza una línea existente.
     */
    update(id: number, data: UpdateLineaDto): Promise<Linea>;
    
    /**
     * Realiza un borrado lógico (soft-delete).
     */
    softDelete(id: number): Promise<void>;
    
    /**
     * Restaura una línea previamente eliminada.
     */
    restore(id: number): Promise<void>;
    
    /**
     * Busca todas las líneas activas.
     */
    findAllActive(): Promise<Linea[]>;
    
    /**
     * Busca una línea activa por su ID.
     */
    findOneActive(id: number): Promise<Linea | null>;
    
    /**
     * Busca una línea activa por su nombre.
     */
    findByName(nombre: string): Promise<Linea | null>;

    //Get a las eliminadas
    findAllSoftDeleted(): Promise<Linea[]>;
}