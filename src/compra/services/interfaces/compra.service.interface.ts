import { CreateCompraDto } from '../../dto/create-compra.dto';
import { UpdateCompraDto } from '../../dto/update-compra.dto';
import { CompraResponseDto } from '../../dto/compra-response.dto';

export interface CompraServiceInterface {
  create(
    createCompraDto: CreateCompraDto,
    userId: number,
  ): Promise<CompraResponseDto>;
  findAll(): Promise<CompraResponseDto[]>;
  findOne(id: number): Promise<CompraResponseDto | null>;
  findByUsuario(idUsuario: number): Promise<CompraResponseDto[]>;
  update(
    idCompra: number,
    updateCompraDto: UpdateCompraDto,
  ): Promise<CompraResponseDto>;
}
