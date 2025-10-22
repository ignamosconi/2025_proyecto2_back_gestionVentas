import { MarcaLinea } from '../../entities/marca-linea.entity';

export interface MarcaLineaControllerInterface {
    assignLinea(marcaId: number, lineaId: number): Promise<MarcaLinea>;
    unassignLinea(marcaId: number, lineaId: number): Promise<void>;
    findAllByMarca(marcaId: number): Promise<MarcaLinea[]>;
    findAll(): Promise<MarcaLinea[]>;
    findAllDeleted(): Promise<MarcaLinea[]>;
}