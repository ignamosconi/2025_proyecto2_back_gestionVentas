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
import { LineaServiceInterface } from './interfaces/linea.service.interface';
import { MarcaServiceInterface } from './interfaces/marca.service.interface';

// Asegúrate de que los tokens de inyección sigan siendo válidos
import { 
    MARCA_LINEA_REPOSITORY, 
    LINEA_SERVICE, 
    MARCA_SERVICE,
} from '../../constants'; 

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
        // 1. Validar existencia de marca y línea
        await Promise.all([
            this.marcaService.findOneActive(data.marcaId), 
            this.lineaService.findOneActive(data.lineaId),
        ]);

        // 2. Verificar si ya existe manualmente (recomendado)
        const existentes = await this.marcaLineaRepository.findAllByMarcaId(data.marcaId);
        const yaExiste = existentes.some(e => e.lineaId === data.lineaId);
        if (yaExiste) {
            throw new ConflictException(
                `El vínculo Marca ID ${data.marcaId} - Línea ID ${data.lineaId} ya existe.`
            );
        }

        // 3. Crear vínculo
        return await this.marcaLineaRepository.create(data);
    }

    
    async unassignLineaFromMarca(marcaId: number, lineaId: number): Promise<void> {
        await this.marcaLineaRepository.softDelete(marcaId, lineaId);
    }

    async findAll(): Promise<MarcaLinea[]> {
        return this.marcaLineaRepository.findAllActive();
    }

    async findAllDeleted(): Promise<MarcaLinea[]> {
        return this.marcaLineaRepository.findAllDeleted();
    }

    async findAllByMarcaId(marcaId: number): Promise<MarcaLinea[]> {
        // Opcional: Puedes validar aquí si la marcaId existe antes de buscar.
        await this.marcaService.findOneActive(marcaId); 
        
        return this.marcaLineaRepository.findAllByMarcaId(marcaId);
    }
}