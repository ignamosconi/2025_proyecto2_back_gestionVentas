import { Marca } from '../../entities/marca.entity';
import { CreateMarcaDto } from '../../dto/create-marca.dto';
import { UpdateMarcaDto } from '../../dto/update-marca.dto';

export interface MarcaControllerInterface {
  findAll(): Promise<Marca[]>;
  findAllDeleted(): Promise<Marca[]>;
  findOne(id: string): Promise<Marca>;

  create(createMarcaDto: CreateMarcaDto): Promise<Marca>;

  update(id: string, updateMarcaDto: UpdateMarcaDto): Promise<Marca>;

  softDelete(id: string): Promise<void>;

  restore(id: string): Promise<void>;
}
