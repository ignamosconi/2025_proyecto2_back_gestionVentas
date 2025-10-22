import { MarcaLinea } from '../../entities/marca-linea.entity';
import { CreateMarcaLineaDto } from '../../dto/create-marca-linea.dto';

export interface MarcaLineaRepositoryInterface {

    create(data: CreateMarcaLineaDto): Promise<MarcaLinea>;
    softDelete(idMarca: number, idLinea: number): Promise<void>;
    restore(idMarca: number, idLinea: number): Promise<void>;
    findOneByIds(marcaId: number, lineaId: number, includeDeleted?: boolean): Promise<MarcaLinea | null>;
    findAllByMarcaId(marcaId: number): Promise<MarcaLinea[]>;
    findAllActive(): Promise<MarcaLinea[]>;
    findAllDeleted(): Promise<MarcaLinea[]>;
}