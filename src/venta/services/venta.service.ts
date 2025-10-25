import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { Venta } from '../entities/venta.entity';
import { DetalleVenta } from '../entities/detalle-venta.entity';
import { VentaRepositoryInterface } from '../repositories/interfaces/venta.repository.interface';
import { ProductoRepositoryInterface } from '../../producto/repositories/interfaces/producto-interface.repository';
import { IUserRepository } from '../../users/interfaces/users.repository.interface';
import { plainToInstance } from 'class-transformer';
import { instanceToPlain } from 'class-transformer';
import { VentaResponseDto } from '../dto/venta-response.dto';
import { VENTA_REPOSITORY, PRODUCTO_REPOSITORY, USUARIO_REPOSITORY } from '../../constants';
import { UpdateVentaDto } from '../dto/update-venta.dto';
import { VentaServiceInterface } from './interfaces/venta.service.interface';
import { IAuditoriaService } from '../../auditoria/interfaces/auditoria.service.interface';
import { EventosAuditoria } from '../../auditoria/helpers/enum.eventos';

@Injectable()
export class VentaService implements VentaServiceInterface {
  constructor(
    @Inject(VENTA_REPOSITORY)
    private readonly ventaRepository: VentaRepositoryInterface,

    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepository: ProductoRepositoryInterface,

    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUserRepository,

    @Inject('IAuditoriaService')
    private readonly auditoriaService: IAuditoriaService,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea una venta con sus detalles, valida stock y actualiza inventario.
   * Retorna un DTO con solo los campos expuestos según VentaResponseDto.
   */
  // En src/ventas/services/venta.service.ts

async create(createVentaDto: CreateVentaDto, userId: number): Promise<VentaResponseDto> {
    const { metodoPago, detalles } = createVentaDto;

    // 1️⃣ Obtener usuario
    const usuario = await this.usuarioRepository.findById(userId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');

    // 2️⃣ Validar stock y preparar detalles
    const detallesVenta: DetalleVenta[] = [];
    const productosAActualizar: { idProducto: number; cantidad: number }[] = [];
    let total = 0;

    for (const item of detalles) {
      const producto = await this.productoRepository.findOneActive(item.idProducto);
      if (!producto) throw new NotFoundException(`Producto con ID ${item.idProducto} no encontrado.`);

      if (producto.stock < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para el producto "${producto.nombre}". Disponible: ${producto.stock}`,
        );
      }

      const precioUnitario = producto.precio;
      const subtotal = precioUnitario * item.cantidad;
      total += subtotal;

      const detalleVenta = new DetalleVenta();
      
      // ASIGNACIÓN DE CLAVE FORÁNEA (Solución de persistencia)
      // Esto fuerza a TypeORM a guardar el ID en la columna 'idProducto'.
      (detalleVenta as any).idProducto = producto.idProducto; 
      
      detalleVenta.producto = producto; // Mantener la entidad es opcional para el DTO final, pero seguro.
      detalleVenta.cantidad = item.cantidad;
      detalleVenta.precioUnitario = precioUnitario;
      detalleVenta.subtotal = subtotal;

      detallesVenta.push(detalleVenta);
      productosAActualizar.push({ idProducto: producto.idProducto, cantidad: item.cantidad });
    }

    // 3️⃣ Crear venta
    const venta = new Venta();
    venta.fechaCreacion = new Date();
    venta.metodoPago = metodoPago;
    venta.total = total;
    venta.usuario = usuario;
    venta.detalles = detallesVenta;

    // 4️⃣ Guardar venta en DB
    let ventaCreada: Venta;
    try {
      ventaCreada = await this.ventaRepository.save(venta);
    } catch (error) {
      throw new BadRequestException('Error al registrar la venta: ' + error.message);
    }

    // 5️⃣ Actualizar stock
    for (const { idProducto, cantidad } of productosAActualizar) {
      await this.productoRepository.updateStock(idProducto, -cantidad);
    }

    // 6️⃣ Recargar venta con relaciones completas
    const ventaRecargada = await this.ventaRepository.findOne(ventaCreada.idVenta);

    //Auditar el registro de ventas
    await this.auditoriaService.registrarEvento(
      usuario.id,
      EventosAuditoria.REGISTRO_VENTA,
      `El usuario ${usuario.email} creó una venta con id ${ventaCreada.idVenta}`,
    );

    // 7️Transformar a DTO de respuesta
    return plainToInstance(VentaResponseDto, ventaRecargada, { excludeExtraneousValues: true });
  }

  async findAll(): Promise<VentaResponseDto[]> {
    const ventas = await this.ventaRepository.findAll();
    return plainToInstance(VentaResponseDto, ventas, { excludeExtraneousValues: true });
  }

  async findOne(id: number): Promise<VentaResponseDto> {
    const venta = await this.ventaRepository.findOne(id);
    if (!venta) throw new NotFoundException('Venta no encontrada.');
    return plainToInstance(VentaResponseDto, venta, { excludeExtraneousValues: true });
  }

  async findByUsuario(idUsuario: number): Promise<VentaResponseDto[]> {
    const ventas = await this.ventaRepository.findByUsuario(idUsuario);
    return plainToInstance(VentaResponseDto, ventas, { excludeExtraneousValues: true });
  }

  async update(idVenta: number, updateVentaDto: UpdateVentaDto): Promise<VentaResponseDto> {
    const { metodoPago, detalles: nuevosDetallesDto } = updateVentaDto;

    // 1️⃣ Iniciar transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 2️⃣ Obtener venta existente con detalles y usuario
        const ventaExistente = await queryRunner.manager.findOne(Venta, {
        where: { idVenta } as any,
        relations: ['detalles', 'detalles.producto', 'usuario'],
        });

        if (!ventaExistente) {
        throw new NotFoundException(`Venta con ID ${idVenta} no encontrada.`);
        }

        const detallesActuales: DetalleVenta[] = ventaExistente.detalles || [];
        const productosAActualizar: { idProducto: number; cambioStock: number }[] = [];
        const detallesAProcesar: DetalleVenta[] = [];
        const detallesAEliminar: DetalleVenta[] = [];
        let nuevoTotal = 0;

        // 3️⃣ Procesar detalles solo si envían nuevos
        if (nuevosDetallesDto?.length) {
        for (const nuevoDetalleDto of nuevosDetallesDto) {
            const idProducto = nuevoDetalleDto.idProducto;
            const cantidadNueva = nuevoDetalleDto.cantidad;

            // Validar que idProducto sea un número válido
            if (idProducto === undefined || idProducto === null || isNaN(Number(idProducto))) {
            throw new BadRequestException(`El idProducto es inválido o no fue proporcionado. Valor recibido: ${idProducto}`);
            }
            
            // Validar que cantidad sea un número válido
            if (cantidadNueva === undefined || cantidadNueva === null || isNaN(Number(cantidadNueva))) {
            throw new BadRequestException(`La cantidad es inválida o no fue proporcionada para el producto con ID ${idProducto}. Valor recibido: ${cantidadNueva}`);
            }

            const detalleExistente = detallesActuales.find(d => (d as any).idProducto === Number(idProducto));
            const producto = await this.productoRepository.findOneActive(Number(idProducto));
            if (!producto) throw new NotFoundException(`Producto con ID ${idProducto} no encontrado.`);

            const precioUnitario = producto.precio;
            const subtotal = precioUnitario * cantidadNueva;
            nuevoTotal += subtotal;

            let cambioStock = 0;

            if (detalleExistente) {
            // MODIFICACIÓN
            cambioStock = detalleExistente.cantidad - cantidadNueva;
            if (cambioStock < 0 && producto.stock < Math.abs(cambioStock)) {
                throw new BadRequestException(
                `Stock insuficiente para aumentar la cantidad del producto "${producto.nombre}". Disponible: ${producto.stock}`
                );
            }

            detalleExistente.cantidad = cantidadNueva;
            detalleExistente.precioUnitario = precioUnitario;
            detalleExistente.subtotal = subtotal;
            detallesAProcesar.push(detalleExistente);
            } else {
            // NUEVO DETALLE
            cambioStock = -cantidadNueva;
            if (producto.stock < cantidadNueva) {
                throw new BadRequestException(
                `Stock insuficiente para agregar el producto "${producto.nombre}". Disponible: ${producto.stock}`
                );
            }

            const nuevoDetalle = new DetalleVenta();
            (nuevoDetalle as any).idProducto = idProducto;
            nuevoDetalle.producto = producto;
            nuevoDetalle.cantidad = cantidadNueva;
            nuevoDetalle.precioUnitario = precioUnitario;
            nuevoDetalle.subtotal = subtotal;
            nuevoDetalle.venta = ventaExistente;
            detallesAProcesar.push(nuevoDetalle);
            }

            if (cambioStock !== 0) {
            productosAActualizar.push({ idProducto, cambioStock });
            }
        }

        // 4️⃣ Detectar detalles eliminados
        const idsNuevos = nuevosDetallesDto.map(d => d.idProducto);
        const eliminados = detallesActuales.filter(d => !idsNuevos.includes((d as any).idProducto));
        for (const detalle of eliminados) {
            productosAActualizar.push({ idProducto: (detalle as any).idProducto, cambioStock: detalle.cantidad });
            detallesAEliminar.push(detalle);
        }

        ventaExistente.detalles = detallesAProcesar;
        ventaExistente.total = nuevoTotal;
        } else {
        // 5️⃣ Si no hay nuevos detalles, mantener los existentes
        ventaExistente.total = detallesActuales.reduce((sum, d) => sum + d.subtotal, 0);
        }

        // 6️⃣ Actualizar metodoPago si viene
        if (metodoPago !== undefined) {
        ventaExistente.metodoPago = metodoPago;
        }

        // 7️⃣ Guardar venta
        await queryRunner.manager.save(ventaExistente);

        // 8️⃣ Eliminar detalles si los hay
        if (detallesAEliminar.length > 0) {
        await queryRunner.manager.remove(detallesAEliminar);
        }

        // 9️⃣ Actualizar stock
        for (const { idProducto, cambioStock } of productosAActualizar) {
        await this.productoRepository.updateStock(idProducto, cambioStock);
        }

        // 🔟 Commit
        await queryRunner.commitTransaction();

        // 1️⃣1️⃣ Recargar venta
        const ventaActualizada = await this.ventaRepository.findOne(idVenta);

        //Auditar la modificación de la venta
        await this.auditoriaService.registrarEvento(
          ventaExistente.usuario.id,
          EventosAuditoria.MODIFICAR_VENTA,
          `El usuario ${ventaExistente.usuario.email} MODIFICÓ la venta con id ${ventaExistente.idVenta}`,
        );

        return plainToInstance(VentaResponseDto, ventaActualizada, { excludeExtraneousValues: true });


    } catch (error) {
        await queryRunner.rollbackTransaction();
        if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
        throw new BadRequestException('Error al actualizar la venta y el inventario: ' + error.message);
    } finally {
        await queryRunner.release();
    }
  }

}
