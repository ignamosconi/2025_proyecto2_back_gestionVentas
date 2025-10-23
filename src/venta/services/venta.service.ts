import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { Venta } from '../entities/venta.entity';
import { DetalleVenta } from '../entities/detalle-venta.entity';
import { VentaRepositoryInterface } from '../repositories/interfaces/venta.repository.interface';
import { ProductoRepositoryInterface } from 'src/producto/repositories/interfaces/producto-interface.repository';
import { IUserRepository } from 'src/users/interfaces/users.repository.interface';
import { plainToInstance } from 'class-transformer';
import { instanceToPlain } from 'class-transformer';
import { VentaResponseDto } from '../dto/venta-response.dto';
import { VENTA_REPOSITORY, PRODUCTO_REPOSITORY, USUARIO_REPOSITORY } from 'src/constants';
import { UpdateVentaDto } from '../dto/update-venta.dto';
import { VentaServiceInterface } from './interfaces/venta.service.interface';

@Injectable()
export class VentaService implements VentaServiceInterface {
  constructor(
    @Inject(VENTA_REPOSITORY)
    private readonly ventaRepository: VentaRepositoryInterface,

    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepository: ProductoRepositoryInterface,

    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUserRepository,

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

  // En src/ventas/services/venta.service.ts (dentro de la clase VentaService)

async update(idVenta: number, updateVentaDto: UpdateVentaDto): Promise<VentaResponseDto> {
    const { metodoPago, detalles: nuevosDetallesDto } = updateVentaDto;

    // Validación esencial para manejar la eliminación de detalles.
    if (!nuevosDetallesDto) {
        throw new BadRequestException('Debe proveer la lista completa de "detalles" para actualizar la venta y gestionar el inventario.');
    }

    // 1️Iniciar Transacción (Usando el patrón del create)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 2️Obtener Venta Existente
        let ventaExistente = await queryRunner.manager.findOne(Venta, {
            where: { idVenta } as any,
            relations: ['detalles', 'detalles.producto', 'usuario']
        });

        if (!ventaExistente) {
            throw new NotFoundException(`Venta con ID ${idVenta} no encontrada.`);
        }

        const detallesActuales: DetalleVenta[] = ventaExistente.detalles || [];
        let nuevoTotal = 0;
        const detallesAProcesar: DetalleVenta[] = [];
        // Almacenará el cambio neto de stock (+devolver, -retirar)
        const productosAActualizar: { idProducto: number; cambioStock: number }[] = []; 
        const detallesAEliminar: DetalleVenta[] = [];

        // 3️Procesar Nuevos Detalles (Iterar, validar y preparar)
        for (const nuevoDetalleDto of nuevosDetallesDto) {
            const idProducto = nuevoDetalleDto.idProducto;
            const cantidadNueva = nuevoDetalleDto.cantidad;

            if (idProducto === undefined) {
                throw new BadRequestException('El idProducto es obligatorio para cada detalle de venta.');
            }

            if (cantidadNueva === undefined) {
                throw new BadRequestException(`La cantidad es requerida para el detalle del producto con ID ${idProducto}.`);
            }

            const detalleExistente = detallesActuales.find(d => (d as any).idProducto === idProducto);
            const producto = await this.productoRepository.findOneActive(idProducto);
            if (!producto) {
                throw new NotFoundException(`Producto con ID ${idProducto} no encontrado.`);
            }

            const precioUnitario = producto.precio;
            const subtotal = precioUnitario * cantidadNueva;
            nuevoTotal += subtotal;

            // 4️Calcular Cambio de Stock
            let cambioStock = 0; 

            if (detalleExistente) {
                // Producto existente: MODIFICACIÓN
                const cantidadAnterior = detalleExistente.cantidad;
                cambioStock = cantidadAnterior - cantidadNueva; // Positivo: devolver; Negativo: retirar más
                
                if (cambioStock < 0) { // Si la cantidad aumenta (se retira más stock)
                    const stockARetirar = Math.abs(cambioStock);
                    if (producto.stock < stockARetirar) {
                        throw new BadRequestException(`Stock insuficiente para aumentar la cantidad del producto "${producto.nombre}". Disponible: ${producto.stock}`);
                    }
                }

                // Actualizar el detalle existente
                detalleExistente.cantidad = cantidadNueva;
                detalleExistente.precioUnitario = precioUnitario; 
                detalleExistente.subtotal = subtotal;
                detallesAProcesar.push(detalleExistente);

            } else {
                // Producto Nuevo: CREACIÓN
                cambioStock = -cantidadNueva; // Retirar todo el stock nuevo
                if (producto.stock < cantidadNueva) {
                    throw new BadRequestException(`Stock insuficiente para agregar el producto "${producto.nombre}". Disponible: ${producto.stock}`);
                }
                
                // Crear el nuevo detalle (misma lógica de persistencia que en el create)
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
                productosAActualizar.push({ 
                    idProducto: idProducto, 
                    cambioStock: cambioStock // Positivo: devolver. Negativo: retirar.
                });
            }
        }
        
        // 5️Identificar Detalles Eliminados y Devolver Stock
        const idsNuevos = nuevosDetallesDto.map(d => d.idProducto);
        const detallesEliminados = detallesActuales.filter(d => !idsNuevos.includes((d as any).idProducto));

        for (const detalle of detallesEliminados) {
            // Devolver todo el stock del producto eliminado (cambioStock positivo)
            productosAActualizar.push({ 
                idProducto: (detalle as any).idProducto, 
                cambioStock: detalle.cantidad 
            });
            detallesAEliminar.push(detalle);
        }

        // 6️Actualizar Entidad Venta Principal
        if (metodoPago !== undefined) {
            ventaExistente.metodoPago = metodoPago;
        }
        ventaExistente.total = nuevoTotal;
        ventaExistente.detalles = detallesAProcesar; 

        // 7️Guardar Venta y Eliminar Detalles (dentro de la transacción)
        await queryRunner.manager.save(ventaExistente);
        
        if (detallesAEliminar.length > 0) {
            // Eliminar los detalles que ya no forman parte de la venta
            await queryRunner.manager.remove(detallesAEliminar);
        }

        // 8️Actualizar Stock (Igual que en el create, pero usando el cambio neto)
        for (const { idProducto, cambioStock } of productosAActualizar) {
            // cambioStock positivo -> suma al stock. cambioStock negativo -> resta al stock.
            await this.productoRepository.updateStock(idProducto, cambioStock); 
        }

        // 9Commit
        await queryRunner.commitTransaction();

        // Recargar y Transformar (Igual que en el create)
        const ventaActualizada = await this.ventaRepository.findOne(idVenta);
        
        return plainToInstance(VentaResponseDto, ventaActualizada, {
            excludeExtraneousValues: true,
        });

    } catch (error) {
        //  Rollback
        await queryRunner.rollbackTransaction();
        
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
            throw error;
        }
        throw new BadRequestException('Error al actualizar la venta y el inventario: ' + error.message);
    } finally {
        await queryRunner.release();
    }
  }
}
