import { Compra } from '../../entities/compra.entity';
import { DetalleCompra } from '../../entities/detalle-compra.entity';
import { QueryRunner } from 'typeorm';

export interface CompraRepositoryInterface {
  
  // CRUD Básico
  findAll(): Promise<Compra[]>;
  findOne(id: number): Promise<Compra | null>;
  findByUsuario(idUsuario: number): Promise<Compra[]>;
  save(compra: Compra): Promise<Compra>;
  updateCompra(id: number, compra: Compra): Promise<Compra | null>;
  
  // Métodos para Transacciones (usados en CompraService)
  getQueryRunner(): QueryRunner;
  removeDetallesInTransaction(detalles: DetalleCompra[], queryRunner: QueryRunner): Promise<void>;
}