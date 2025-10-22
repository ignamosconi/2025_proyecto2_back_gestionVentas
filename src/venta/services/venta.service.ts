import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { Venta } from '../entities/venta.entity';
import { DetalleVenta } from '../entities/detalle-venta.entity';
import { VentaRepositoryInterface } from '../repositories/interfaces/venta.repository.interface';
import { VENTA_REPOSITORY, PRODUCTO_REPOSITORY, USUARIO_REPOSITORY } from '../../constants';
import { ProductoRepositoryInterface } from 'src/producto/repositories/interfaces/producto-interface.repository';
import { IUserRepository } from 'src/users/interfaces/users.repository.interface';

@Injectable()
export class VentaService {
  constructor(
    @Inject(VENTA_REPOSITORY)
    private readonly ventaRepository: VentaRepositoryInterface,

    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepository: ProductoRepositoryInterface,

    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: IUserRepository,
  ) {}

  /**
   * Crea una nueva venta con sus detalles, valida stock y actualiza inventario.
   */
async create(createVentaDto: CreateVentaDto): Promise<Venta> {
    // --------------------------------------------
    // 1️⃣ Validar detalles
    // --------------------------------------------
    if (!createVentaDto.detalles || createVentaDto.detalles.length === 0) {
      throw new BadRequestException('La venta debe incluir al menos un detalle.');
    }

    // --------------------------------------------
    // 2️⃣ Crear la venta base (sin total aún)
    // --------------------------------------------
    const venta = this.ventaRepository.create({
      metodoPago: createVentaDto.metodoPago,
      total: 0, // lo calculamos después
      fecha: new Date(),
    });
    await this.ventaRepository.save(venta);

    // --------------------------------------------
    // 3️⃣ Procesar cada detalle
    // --------------------------------------------
    let totalVenta = 0;

    for (const detalle of createVentaDto.detalles) {
      const producto = await this.productoService.findOneActive(detalle.idProducto);

      if (!producto) {
        throw new NotFoundException(`El producto con ID ${detalle.idProducto} no existe.`);
      }

      if (producto.stock < detalle.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para el producto "${producto.nombre}". Disponible: ${producto.stock}`
        );
      }

      // Calcular precio unitario y subtotal
      const precioUnitario = producto.precio;
      const subtotal = precioUnitario * detalle.cantidad;
      totalVenta += subtotal;

      // Actualizar stock usando el método oficial del servicio de productos
      await this.productoService.updateStock(producto.idProducto, { change: -detalle.cantidad });

      // Crear y guardar el detalle
      const detalleVenta = this.detalleVentaRepository.create({
        cantidad: detalle.cantidad,
        precioUnitario,
        subtotal,
        idProducto: producto.idProducto,
        idVenta: venta.idVenta,
      });

      await this.detalleVentaRepository.save(detalleVenta);
    }

    // --------------------------------------------
    // 4️⃣ Actualizar total final de la venta
    // --------------------------------------------
    venta.total = totalVenta;
    await this.ventaRepository.save(venta);

    // --------------------------------------------
    // 5️⃣ Retornar la venta con los detalles
    // --------------------------------------------
    const ventaFinal = await this.ventaRepository.findOne({
      where: { idVenta: venta.idVenta },
      relations: ['detalles'],
    });

    return ventaFinal!;
  }
}

  async findAll(): Promise<Venta[]> {
    return this.ventaRepository.findAll();
  }

  async findOne(id: number): Promise<Venta> {
    const venta = await this.ventaRepository.findOne(id);
    if (!venta) throw new NotFoundException('Venta no encontrada.');
    return venta;
  }

  async findByUsuario(idUsuario: number): Promise<Venta[]> {
    return this.ventaRepository.findByUsuario(idUsuario);
  }
}
