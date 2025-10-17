import { MarcaLinea } from '../../entities/marca-linea.entity';
import { CreateMarcaLineaDto } from '../../dto/create-marca-linea.dto';

export interface MarcaLineaRepositoryInterface {
    /**
     * Crea un nuevo vínculo Marca-Línea.
     */
    create(data: CreateMarcaLineaDto): Promise<MarcaLinea>;
    
    /**
     * Elimina un vínculo Marca-Línea existente.
     */
    delete(idMarca: number, idLinea: number): Promise<void>;
    
    /**
     * Busca un vínculo por nombre de Línea dentro de una Marca específica. 
     * Usado para la restricción de negocio (ej. "solo una línea 'Zapatillas' por Marca").
     */
    findAllByMarcaId(marcaId: number): Promise<MarcaLinea[]>;
}