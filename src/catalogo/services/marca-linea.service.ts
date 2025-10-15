// src/catalogo/services/marca-linea.service.ts

import { 
    Injectable, 
    Inject, 
    ConflictException, 
    NotFoundException,
} from '@nestjs/common';
import { CreateMarcaLineaDto } from '../dto/create-marca-linea.dto';
import { MarcaLinea } from '../entities/marca-linea.entity';
import { MarcaLineaServiceInterface } from './interfaces/marca-linea.service.interface';
import { MarcaLineaRepositoryInterface } from '../repositories/interfaces/marca-linea.repository.interface';
import { LineaServiceInterface } from './interfaces/linea.service-interface';
import { MarcaServiceInterface } from './interfaces/marca.service-interface';

// Asegúrate de que los tokens de inyección sigan siendo válidos
import { 
    MARCA_LINEA_REPOSITORY, 
    LINEA_SERVICE, 
    MARCA_SERVICE,
} from '../constants'; 

@Injectable()
export class MarcaLineaService implements MarcaLineaServiceInterface {
    
    constructor(
        @Inject(MARCA_LINEA_REPOSITORY)
        private readonly marcaLineaRepository: MarcaLineaRepositoryInterface,
        @Inject(MARCA_SERVICE)
        private readonly marcaService: MarcaServiceInterface,
        @Inject(LINEA_SERVICE)
        private readonly lineaService: LineaServiceInterface,
    ) {}

    async assignLineaToMarca(data: CreateMarcaLineaDto): Promise<MarcaLinea> {
        
        // 1. Verificar la existencia de Marca y Línea (se usan los IDs del DTO)
        await Promise.all([
            this.marcaService.findOneActive(data.marcaId), 
            this.lineaService.findOneActive(data.lineaId),
        ]);
        
        // 2. Intentar crear la asignación y manejar el error de Clave Primaria
        try {
            // El Repositorio debe usar los mismos nombres (marcaId, lineaId)
            return await this.marcaLineaRepository.create(data); 
        } catch (error) {
            // Manejamos el error de Clave Primaria Duplicada (PK = marcaId + lineaId)
            if (error.code === '23505' || error.message.includes('duplicate key')) {
                throw new ConflictException(
                    `El vínculo (Marca ID ${data.marcaId} - Línea ID ${data.lineaId}) ya existe.`
                );
            }
            throw error;
        }
    }

    async unassignLineaFromMarca(marcaId: number, lineaId: number): Promise<void> {
        // Delegamos al repositorio la eliminación del registro
        await this.marcaLineaRepository.delete(marcaId, lineaId);
    }

    async findAllByMarcaId(marcaId: number): Promise<MarcaLinea[]> {
        // Opcional: Puedes validar aquí si la marcaId existe antes de buscar.
        await this.marcaService.findOneActive(marcaId); 
        
        return this.marcaLineaRepository.findAllByMarcaId(marcaId);
    }
}