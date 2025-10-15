import { MarcaLinea } from '../../entities/marca-linea.entity';
import { CreateMarcaLineaDto } from '../../dto/create-marca-linea.dto';

export interface MarcaLineaControllerInterface {

    assignLinea(createMarcaLineaDto: CreateMarcaLineaDto): Promise<MarcaLinea>;

    unassignLinea(marcaId: number, lineaId: number): Promise<void>;
}