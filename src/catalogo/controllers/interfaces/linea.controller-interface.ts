// src/catalogo/interfaces/linea.controller.interface.ts

import { Linea } from '../../entities/linea.entity';
import { CreateLineaDto } from '../../dto/create-linea.dto';
import { UpdateLineaDto } from '../../dto/update-linea.dto';

/**
 * Contrato para el controlador de Líneas.
 */
export interface LineaControllerInterface {
    findAll(): Promise<Linea[]>;
    findOne(id: number): Promise<Linea>;
    create(data: CreateLineaDto): Promise<Linea>;
    update(id: number, data: UpdateLineaDto): Promise<Linea>;
    softDelete(id: number): Promise<void>;
    restore(id: number): Promise<void>;
}