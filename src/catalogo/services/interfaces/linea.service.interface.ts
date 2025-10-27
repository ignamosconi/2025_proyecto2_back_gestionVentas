// src/catalogo/interfaces/linea.service.interface.ts

import { Linea } from '../../entities/linea.entity';
import { CreateLineaDto } from '../../dto/create-linea.dto';
import { UpdateLineaDto } from '../../dto/update-linea.dto';

export interface LineaServiceInterface {
  // Lectura
  findAll(): Promise<Linea[]>;
  findOneActive(id: number): Promise<Linea>;
  findAllSoftDeleted(): Promise<Linea[]>;

  // Escritura
  create(data: CreateLineaDto): Promise<Linea>;
  update(id: number, data: UpdateLineaDto): Promise<Linea>;
  softDelete(id: number): Promise<void>;
  restore(id: number): Promise<void>;

  // Futura validación: Si una línea no se puede eliminar por tener productos asociados
  // (similar al caso de Marca, pero esto iría en el futuro módulo de Productos).
}
