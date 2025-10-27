// src/catalogo/repositories/linea.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, DataSource, IsNull, Not } from 'typeorm';

import { Linea } from '../entities/linea.entity';
import { CreateLineaDto } from '../dto/create-linea.dto';
import { UpdateLineaDto } from '../dto/update-linea.dto';
import { LineaRepositoryInterface } from './interfaces/linea.repository.interface';

@Injectable()
export class LineaRepository implements LineaRepositoryInterface {
  private repository: Repository<Linea>;

  constructor(
    // Inyección del DataSource para obtener el Repository de TypeORM
    private dataSource: DataSource,
  ) {
    this.repository = this.dataSource.getRepository(Linea);
  }

  // --- Implementación de Métodos ---

  async create(data: CreateLineaDto): Promise<Linea> {
    const linea = this.repository.create(data);
    return this.repository.save(linea);
  }

  async update(id: number, data: UpdateLineaDto): Promise<Linea> {
    // Ejecuta la actualización
    await this.repository.update(id, data);

    // Retorna la entidad actualizada y activa
    const updatedLinea = await this.findOneActive(id);
    if (!updatedLinea) {
      // Si no se encuentra después de actualizar, es un 404
      throw new NotFoundException(`Línea con ID ${id} no encontrada.`);
    }
    return updatedLinea;
  }

  async softDelete(id: number): Promise<void> {
    const result = await this.repository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Línea activa con ID ${id} no encontrada.`);
    }
  }

  async restore(id: number): Promise<void> {
    const result = await this.repository.restore(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Línea con ID ${id} para restaurar no encontrada.`,
      );
    }
  }

  async findAllSoftDeleted(): Promise<Linea[]> {
    return this.repository.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true, // Necesario para incluir soft-deleted en el query
    });
  }

  async findAllActive(): Promise<Linea[]> {
    // TypeORM excluye automáticamente las eliminadas si se usa el decorador @DeleteDateColumn
    return this.repository.find();
  }

  async findOneActive(id: number): Promise<Linea | null> {
    // Busca una línea que no esté eliminada
    return this.repository.findOne({ where: { id } });
  }

  async findByName(
    nombre: string,
    includeDeleted: boolean = false,
  ): Promise<Linea | null> {
    // Si includeDeleted es true, busca la línea por nombre incluyendo las eliminadas
    return this.repository.findOne({
      where: { nombre },
      withDeleted: includeDeleted, // Incluir registros eliminados si se solicita
    });
  }
}
