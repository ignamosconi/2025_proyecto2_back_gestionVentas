// src/catalogo/interfaces/marca.repository-interface.ts

import { Marca } from '../../entities/marca.entity';
import { CreateMarcaDto } from '../../dto/create-marca.dto';
import { UpdateMarcaDto } from '../../dto/update-marca.dto';

/**
 * Define el contrato para el acceso a datos de la entidad Marca.
 * La capa de Servicio dependerá solo de esta interfaz.
 */
export interface MarcaRepositoryInterface {
  
  // --- Métodos Requeridos por la US 8 ---

  /**
   * Criterio: "No puede haber dos nombres de marcas iguales en el sistema."
   * Verifica la existencia de una marca por su nombre (para validación de unicidad).
   * @param name Nombre de la marca a buscar.
   */
  findByName(name: string): Promise<Marca | null>;

  /**
   * Criterio: "El formulario de creación de marcas debe permitir ingresar: nombre, descripción."
   * Crea y guarda una nueva instancia de Marca.
   * @param data DTO con los datos de creación.
   */
  create(data: CreateMarcaDto): Promise<Marca>;

  /**
   * Criterio: "Modificar marcas..."
   * Actualiza la información de una marca existente.
   * @param id ID de la marca a actualizar.
   * @param data DTO con los datos de actualización.
   */
  update(id: number, data: UpdateMarcaDto): Promise<Marca>;

  /**
   * Criterio: "Si una marca tiene productos asociados, el sistema debe impedir su eliminación."
   * Busca una marca por ID y carga la relación de productos.
   * @param id ID de la marca.
   */
  findOneWithProducts(id: number): Promise<Marca | null>;
  
  /**
   * Criterio: "eliminar marcas..."
   * Elimina lógicamente (soft delete) una marca.
   * La eliminación lógica soporta el criterio de "Las marcas eliminadas no deben aparecer...".
   * @param id ID de la marca a eliminar.
   */
  softDelete(id: number): Promise<void>;
  restore(id: number): Promise<void>;

  // --- Métodos de Consulta y Visibilidad ---

  /**
   * Criterio: "Las marcas eliminadas no deben aparecer... en formularios ni en listados visibles."
   * Obtiene todas las marcas activas (no eliminadas).
   */
  findAllActive(): Promise<Marca[]>;
  
  /**
   * Obtiene una marca activa por su ID.
   * @param id ID de la marca.
   */
  findOneActive(id: number): Promise<Marca | null>;

  // --- Métodos de Relación (de la US anterior) ---

  /**
   * Busca marcas por Línea, si fuera necesario.
   * @param lineId ID de la línea a buscar.
   */
  findByLineId(lineId: number): Promise<Marca[]>;
}