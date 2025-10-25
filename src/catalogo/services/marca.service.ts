// src/catalogo/services/marca.service.ts

import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { MarcaServiceInterface } from './interfaces/marca.service.interface';
import { MarcaRepositoryInterface } from '../repositories/interfaces/marca.repository.interface';
import { MarcaLineaRepositoryInterface } from '../repositories/interfaces/marca-linea.repository.interface';
import { ProductoRepositoryInterface } from '../../producto/repositories/interfaces/producto-interface.repository';
import {
  MARCA_REPOSITORY,
  MARCA_LINEA_REPOSITORY,
  PRODUCTO_REPOSITORY,
} from '../../constants';

import { Marca } from '../entities/marca.entity';
import { CreateMarcaDto } from '../dto/create-marca.dto';
import { UpdateMarcaDto } from '../dto/update-marca.dto';

@Injectable()
export class MarcaService implements MarcaServiceInterface {
  constructor(
    // Inyección del token del repositorio (DIP)
    @Inject(MARCA_REPOSITORY)
    private readonly marcaRepository: MarcaRepositoryInterface,

    @Inject(MARCA_LINEA_REPOSITORY)
    private readonly marcaLineaRepository: MarcaLineaRepositoryInterface,

    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepository: ProductoRepositoryInterface,
  ) {}

  // ---------------------------------------------------------------------
  // MÉTODOS DE LECTURA (READ) (Sin cambios)
  // ---------------------------------------------------------------------

  /**
   * Devuelve todas las marcas activas (no eliminadas suavemente).
   */
  async findAll(): Promise<Marca[]> {
    return this.marcaRepository.findAllActive();
  }

  async findAllDeleted(): Promise<Marca[]> {
    return this.marcaRepository.findAllDeleted();
  }

  /**
   * Devuelve una marca activa por ID. Lanza 404 si no existe.
   */
  async findOneActive(id: number): Promise<Marca> {
    const marca = await this.marcaRepository.findOneActive(id);
    if (!marca) {
      throw new NotFoundException(
        `Marca con ID ${id} no encontrada o está eliminada.`,
      );
    }
    return marca;
  }

  // ---------------------------------------------------------------------
  // MÉTODOS DE ESCRITURA (CREATE, UPDATE, DELETE, RESTORE) (Lógica de softDelete modificada)
  // ---------------------------------------------------------------------

  /**
   * Crea una nueva marca.
   * Si existe una marca eliminada con el mismo nombre, primero la restaura.
   */
  async create(data: CreateMarcaDto): Promise<Marca> {
    // Lógica de Negocio: 1. Validación de unicidad entre marcas activas
    const existingActiveMarca = await this.marcaRepository.findByName(
      data.nombre,
    );
    if (existingActiveMarca) {
      throw new BadRequestException(
        `El nombre de marca '${data.nombre}' ya existe en el sistema.`,
      );
    }

    // 2. Verificar si existe una marca eliminada con el mismo nombre
    const existingDeletedMarca = await this.marcaRepository.findByName(
      data.nombre,
      true,
    );
    if (existingDeletedMarca && existingDeletedMarca.deletedAt) {
      // Si existe una marca eliminada con el mismo nombre, la restauramos
      await this.marcaRepository.restore(existingDeletedMarca.id);
      // Y la actualizamos con los nuevos datos si hay cambios adicionales
      return this.marcaRepository.update(existingDeletedMarca.id, data);
    }

    // 3. Delegación de la creación al repositorio
    return this.marcaRepository.create(data);
  }

  /**
   * Actualiza los datos de una marca existente.
   */
  async update(id: number, data: UpdateMarcaDto): Promise<Marca> {
    // Lógica de Negocio: 1. Validación de unicidad durante la actualización
    if (data.nombre) {
      const existingMarca = await this.marcaRepository.findByName(data.nombre);

      if (existingMarca && existingMarca.id !== id) {
        throw new BadRequestException(
          `El nombre de marca '${data.nombre}' ya está siendo usado por otra marca.`,
        );
      }
    }

    // 2. Delegación de la actualización al repositorio.
    return this.marcaRepository.update(id, data);
  }

  /**
   * Realiza la eliminación suave de la marca.
   * RESTRICCIÓN: IMPEDIR ELIMINACIÓN si hay productos asociados.
   * También elimina (soft delete) todas las relaciones marcaLinea asociadas.
   */
  async softDelete(id: number): Promise<void> {
    // 1. Validar que la marca exista y esté activa antes de verificar productos
    await this.findOneActive(id);

    // 2. Lógica de Negocio: Verificar dependencia de productos
    const hasProducts = await this.productoRepository.hasProductsByMarcaId(id);

    if (hasProducts) {
      // Lanza 409 Conflict si la marca tiene dependencias activas
      throw new ConflictException(
        `No se puede eliminar la marca con ID ${id} porque tiene productos asociados. Debe desvincular los productos primero.`,
      );
    }

    // 3. Eliminar todas las relaciones marcaLinea asociadas a esta marca
    await this.marcaLineaRepository.softDeleteAllByMarcaId(id);

    // 4. Delegación al repositorio para eliminar la marca
    await this.marcaRepository.softDelete(id);
  }

  /**
   * Restaura una marca previamente eliminada suavemente.
   */
  async restore(id: number): Promise<void> {
    // El repositorio se encarga de: restaurar el registro (deletedAt = NULL).
    await this.marcaRepository.restore(id);
  }
}
