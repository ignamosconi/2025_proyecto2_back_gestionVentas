// src/catalogo/repositories/marca.repository.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Marca } from '../entities/marca.entity';
import { MarcaRepositoryInterface } from './interfaces/marca.repository.interface';
import { CreateMarcaDto } from '../dto/create-marca.dto';
import { UpdateMarcaDto } from '../dto/update-marca.dto';
import { MarcaLinea } from '../entities/marca-linea.entity';

@Injectable()
export class MarcaRepository implements MarcaRepositoryInterface {
  constructor(
    // Inyección del repositorio nativo de TypeORM para la entidad Marca
    @InjectRepository(Marca)
    private readonly marcaOrmRepository: Repository<Marca>,

    // Inyección del repositorio nativo de TypeORM para la entidad de asociación Marca_Linea
    @InjectRepository(MarcaLinea)
    private readonly brandLineOrmRepository: Repository<MarcaLinea>,
  ) {}

  // =================================================================
  // --- Métodos Requeridos por la US 8 ---
  // =================================================================

  async findByName(name: string): Promise<Marca | null> {
    // Buscamos una marca que coincida con el nombre y que NO haya sido eliminada suavemente (deletedAt IS NULL).
    // TypeORM maneja el filtro deletedAt automáticamente en .findOneBy() si la entidad tiene @DeleteDateColumn.
    return this.marcaOrmRepository.findOneBy({ nombre: name });
  }

  async create(data: CreateMarcaDto): Promise<Marca> {
    try {
      const newMarca = this.marcaOrmRepository.create(data);
      return await this.marcaOrmRepository.save(newMarca);
    } catch (error) {
      // Manejo de errores de base de datos, si la validación de unicidad falla por concurrencia
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
          throw new BadRequestException('El nombre de la marca ya existe en el sistema.');
      }
      throw error;
    }
  }

  async update(id: number, data: UpdateMarcaDto): Promise<Marca> {
    const marca = await this.marcaOrmRepository.findOneBy({ id });
    if (!marca) {
      throw new NotFoundException(`Marca con ID ${id} no encontrada.`);
    }

    // Aplica los cambios y guarda. La validación de unicidad del nombre la maneja la BD.
    this.marcaOrmRepository.merge(marca, data);
    return this.marcaOrmRepository.save(marca);
  }

  async findOneWithProducts(id: number): Promise<Marca | null> {
    // Criterio: Necesitamos saber si hay productos asociados.
    return this.marcaOrmRepository.findOne({
      where: { id },
      relations: ['productos'], // Carga la relación 'productos' para poder contarlos en el servicio
    });
  }

  async softDelete(id: number): Promise<void> {
    // Criterio: "Las marcas eliminadas no deben aparecer..."
    // TypeORM setea automáticamente la columna 'deletedAt'.
    const result = await this.marcaOrmRepository.softDelete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Marca con ID ${id} no encontrada para eliminar.`);
    }
  }

  async restore(id: number): Promise<void> {
    // TypeORM restaura el registro, seteando 'deletedAt' a NULL.
    const result = await this.marcaOrmRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Marca con ID ${id} no encontrada o no está marcada como eliminada para restaurar.`);
    }
  }

  // =================================================================
  // --- Métodos de Consulta y Relación ---
  // =================================================================

  async findAllActive(): Promise<Marca[]> {
    // Gracias a @DeleteDateColumn, 'find()' de TypeORM solo trae las marcas donde deletedAt IS NULL.
    return this.marcaOrmRepository.find();
  }

  async findAllDeleted(): Promise<Marca[]> {
    return this.marcaOrmRepository.find({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
    });
  }
  
  async findOneActive(id: number): Promise<Marca | null> {
    return this.marcaOrmRepository.findOneBy({ id });
  }

  async findByLineId(lineId: number): Promise<Marca[]> {
    // Implementación usando la tabla intermedia BrandLine si es necesario
    return this.marcaOrmRepository
      .createQueryBuilder('marca')
      .innerJoin('marca.brandLines', 'bl', 'bl.lineId = :lineId', { lineId })
      .getMany();
  }

  // Método de la US anterior: asociar línea
  async associateLine(marcaId: number, lineaId: number): Promise<MarcaLinea> {
    // Implementación usando la tabla BrandLine con manejo de unicidad de la BD
    try {
      const newAssociation = this.brandLineOrmRepository.create({ marcaId, lineaId });
      return await this.brandLineOrmRepository.save(newAssociation);
    } catch (error) {
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Esta marca ya tiene asociada esta línea (violación de unicidad).');
      }
      throw error;
    }
  }
}