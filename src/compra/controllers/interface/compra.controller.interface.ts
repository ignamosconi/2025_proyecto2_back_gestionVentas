import { CreateCompraDto } from '../../dto/create-compra.dto';
import { UpdateCompraDto } from '../../dto/update-compra.dto';
import { CompraResponseDto } from '../../dto/compra-response.dto';

export interface CompraControllerInterface {
  findAll(): Promise<CompraResponseDto[]>;
  findOne(id: number): Promise<CompraResponseDto | null>;
  findByUsuario(idUsuario: number): Promise<CompraResponseDto[]>;
  create(
    createCompraDto: CreateCompraDto,
    req: any,
  ): Promise<CompraResponseDto>;
  update(
    id: number,
    updateCompraDto: UpdateCompraDto,
  ): Promise<CompraResponseDto>;
}
