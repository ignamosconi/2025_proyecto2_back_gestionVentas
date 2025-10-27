// src/catalogo/interfaces/marca-linea.service.interface.ts

import { MarcaLinea } from '../../entities/marca-linea.entity';
import { CreateMarcaLineaDto } from '../../dto/create-marca-linea.dto';

export interface MarcaLineaServiceInterface {
  /**
   * Asigna una línea a una marca (Crea el vínculo M:M).
   * @param data DTO con marcaId y lineaId.
   */
  assignLineaToMarca(data: CreateMarcaLineaDto): Promise<MarcaLinea>;
  findAllByMarcaId(marcaId: number): Promise<MarcaLinea[]>;

  //Buscar global
  findAll(): Promise<MarcaLinea[]>;
  findAllDeleted(): Promise<MarcaLinea[]>;

  /**
   * Desasigna una línea de una marca (Elimina el vínculo M:M).
   */
  unassignLineaFromMarca(marcaId: number, lineaId: number): Promise<void>;
}
