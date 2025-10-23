import { Marca } from '../../entities/marca.entity';
import { CreateMarcaDto } from '../../dto/create-marca.dto';
import { UpdateMarcaDto } from '../../dto/update-marca.dto';

// Define el contrato para la lógica de negocio de la gestión de Marcas.
export interface MarcaServiceInterface {
    
    // Lectura
    findAll(): Promise<Marca[]>;
    findOneActive(id: number): Promise<Marca>;
    findAllDeleted(): Promise<Marca[]>;

    // Escritura
    create(data: CreateMarcaDto): Promise<Marca>;
    update(id: number, data: UpdateMarcaDto): Promise<Marca>;
    softDelete(id: number): Promise<void>;
    restore(id: number): Promise<void>;
}