// src/ventas/repositories/venta.repository.ts

import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { VentaRepositoryInterface } from './interfaces/venta.repository.interface';
import { Venta } from '../entities/venta.entity';
import { DetalleVenta } from '../entities/detalle-venta.entity';
import { CreateVentaDto } from '../dto/create-venta.dto';

@Injectable()
export class VentaRepository implements VentaRepositoryInterface {
  private repository: Repository<Venta>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Venta);
  }

  // Listar todas las ventas
  findAll(): Promise<Venta[]> {
    return this.repository.find({
      relations: ['detalles', 'detalles.producto', 'usuario'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  // Buscar una venta por ID
  findOne(id: number): Promise<Venta | null> {
    return this.repository.findOne({
      where: { idVenta: id },
      relations: ['detalles', 'detalles.producto', 'usuario'],
    });
  }

  // Buscar todas las ventas de un usuario
  findByUsuario(idUsuario: number): Promise<Venta[]> {
    return this.repository.find({
      where: { usuario: { id: idUsuario } },
      relations: ['detalles', 'detalles.producto', 'usuario'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  // Crear una venta (recibe la entidad lista, calculada en el service)
  async create(venta: Venta): Promise<Venta> {
    const entity = this.repository.create(venta);
    return this.repository.save(entity);
  }
}
