import { MarcaLinea } from '../../entities/marca-linea.entity';
import { CreateMarcaLineaDto } from '../../dto/create-marca-linea.dto';

export interface MarcaLineaRepositoryInterface {
  create(data: CreateMarcaLineaDto): Promise<MarcaLinea>;
  softDelete(idMarca: number, idLinea: number): Promise<void>;
  softDeleteAllByMarcaId(marcaId: number): Promise<void>;
  softDeleteAllByLineaId(lineaId: number): Promise<void>;
  restore(idMarca: number, idLinea: number): Promise<void>;
  findOneByIds(
    marcaId: number,
    lineaId: number,
    includeDeleted?: boolean,
  ): Promise<MarcaLinea | null>;
  findAllByMarcaId(marcaId: number): Promise<MarcaLinea[]>;
  findAllByLineaId(lineaId: number): Promise<MarcaLinea[]>;
  hasMarcasByLineaId(lineaId: number): Promise<boolean>;
  findAllActive(): Promise<MarcaLinea[]>;
  findAllDeleted(): Promise<MarcaLinea[]>;
}
