import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';

// Interfaces y Entidades de COMPRA
import { CompraServiceInterface } from './interfaces/compra.service.interface';
import { CompraRepositoryInterface } from '../repositories/interfaces/compra.repository.interface';
import { Compra } from '../entities/compra.entity';
import { DetalleCompra } from '../entities/detalle-compra.entity';
// DTOs de Compra
import { CreateCompraDto } from '../dto/create-compra.dto';
import { UpdateCompraDto } from '../dto/update-compra.dto';
import { CompraResponseDto } from '../dto/compra-response.dto'; 

// Repositorios compartidos e Interfaces
import { ProductoRepositoryInterface } from 'src/producto/repositories/interfaces/producto-interface.repository';
import { IUserRepository } from 'src/users/interfaces/users.repository.interface';
import { 
    COMPRA_REPOSITORY, 
    PRODUCTO_REPOSITORY, 
    USUARIO_REPOSITORY,
    PROVEEDOR_REPOSITORY,
    PRODUCTO_PROVEEDOR_SERVICE // NUEVA CONSTANTE
} from 'src/constants'; 
import { ProveedorRepositoryInterface } from 'src/proveedor/repositories/interfaces/proveedor.repository.interface';
import { ProductoProveedorServiceInterface } from 'src/proveedor/services/interfaces/producto-proveedor.service.interface';
import { IAuditoriaService } from 'src/auditoria/interfaces/auditoria.service.interface';
import { EventosAuditoria } from 'src/auditoria/helpers/enum.eventos';

@Injectable()
export class CompraService implements CompraServiceInterface {
    constructor(
        @Inject(COMPRA_REPOSITORY)
        private readonly compraRepository: CompraRepositoryInterface,

        @Inject(PRODUCTO_REPOSITORY)
        private readonly productoRepository: ProductoRepositoryInterface,

        @Inject(USUARIO_REPOSITORY)
        private readonly usuarioRepository: IUserRepository,
        
        @Inject(PROVEEDOR_REPOSITORY)
        private readonly proveedorRepository: ProveedorRepositoryInterface,

        //Verificar si Producto y Proveedor están linkeados
        @Inject(PRODUCTO_PROVEEDOR_SERVICE)
        private readonly productoProveedorService: ProductoProveedorServiceInterface,

        @Inject('IAuditoriaService')
        private readonly auditoriaService: IAuditoriaService,

        private readonly dataSource: DataSource,
    ) {}

    // ---------------------------------------------------------------------
    // CREAR COMPRA (POST)
    // ---------------------------------------------------------------------

    async create(createCompraDto: CreateCompraDto, userId: number): Promise<CompraResponseDto> {
        const { metodoPago, detalles, idProveedor } = createCompraDto;

        // 1. Obtener usuario y proveedor
        const usuario = await this.usuarioRepository.findById(userId);
        if (!usuario) throw new NotFoundException('Usuario no encontrado.');

        // Se usa findOne en lugar de findOneActive, ya que la compra no requiere que el proveedor esté activo.
        const proveedor = await this.proveedorRepository.findOne(idProveedor); 
        if (!proveedor) throw new NotFoundException('Proveedor no encontrado.');

        // 2. Preparar detalles y calcular total
        const detallesCompra: DetalleCompra[] = [];
        const productosAActualizar: { idProducto: number; cantidad: number }[] = [];
        let total = 0;

        for (const item of detalles) {
            // VALIDACIÓN CLAVE: Verificar si el Producto está asociado al Proveedor
            const link = await this.productoProveedorService.checkLinkExists(item.idProducto, idProveedor);
            if (!link) {
                throw new BadRequestException(
                    `El producto con ID ${item.idProducto} no está asociado al proveedor con ID ${idProveedor}. La compra no puede ser procesada.`
                );
            }
            
            const producto = await this.productoRepository.findOneActive(item.idProducto);
            if (!producto) throw new NotFoundException(`Producto con ID ${item.idProducto} no encontrado o está inactivo.`);
            
            // ... (Resto de la lógica del detalle de compra)
            const precioUnitario = producto.precio;
            const subtotal = precioUnitario * item.cantidad;
            total += subtotal;

            const detalleCompra = new DetalleCompra();
            
            (detalleCompra as any).idProducto = producto.idProducto; 
            
            detalleCompra.producto = producto; 
            detalleCompra.cantidad = item.cantidad;
            detalleCompra.precioUnitario = precioUnitario;
            detalleCompra.subtotal = subtotal;

            detallesCompra.push(detalleCompra);
            productosAActualizar.push({ idProducto: producto.idProducto, cantidad: item.cantidad });
        }

        // 3. Crear Compra
        const compra = new Compra();
        compra.fechaCreacion = new Date();
        compra.metodoPago = metodoPago;
        compra.total = total;
        compra.usuario = usuario;
        compra.proveedor = proveedor; 
        compra.detalles = detallesCompra;
        
        // 4. Iniciar Transacción
        let compraCreada: Compra;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Guardar la compra junto con los detalles
            compraCreada = await queryRunner.manager.save(compra);

            // 5. Actualizar stock (SUMAR STOCK)
            for (const { idProducto, cantidad } of productosAActualizar) {
                await this.productoRepository.updateStock(idProducto, cantidad); 
            }
            
            // 6. Commit y Recargar
            await queryRunner.commitTransaction();
            const compraRecargada = await this.compraRepository.findOne(compraCreada.idCompra);

            //Auditar el proceso
            await this.auditoriaService.registrarEvento(
                usuario.id,
                EventosAuditoria.REGISTRO_COMPRA,
                `El usuario ${usuario.email} CREÓ una COMPRA con id ${compraCreada.idCompra}`,
            );

            // 7. Transformar a DTO de respuesta
            return plainToInstance(CompraResponseDto, compraRecargada, { excludeExtraneousValues: true });

        } catch (error) {
            await queryRunner.rollbackTransaction();
            // Si el error fue por la validación del link o producto no encontrado, relanzamos
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error al registrar la compra y actualizar el inventario: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }
    
    // ---------------------------------------------------------------------
    // BUSCAR (FIND)
    // ---------------------------------------------------------------------

    async findAll(): Promise<CompraResponseDto[]> {
        const compras = await this.compraRepository.findAll();
        return plainToInstance(CompraResponseDto, compras, { excludeExtraneousValues: true });
    }

    async findOne(id: number): Promise<CompraResponseDto> {
        const compra = await this.compraRepository.findOne(id);
        if (!compra) throw new NotFoundException('Compra no encontrada.');
        return plainToInstance(CompraResponseDto, compra, { excludeExtraneousValues: true });
    }

    async findByUsuario(idUsuario: number): Promise<CompraResponseDto[]> {
        const compras = await this.compraRepository.findByUsuario(idUsuario);
        return plainToInstance(CompraResponseDto, compras, { excludeExtraneousValues: true });
    }

    // ---------------------------------------------------------------------
    // ACTUALIZAR COMPRA (PUT) - LÓGICA TRANSACCIONAL COMPLEJA
    // ---------------------------------------------------------------------

    async update(idCompra: number, updateCompraDto: UpdateCompraDto): Promise<CompraResponseDto> {
        // Asumo que idProveedor es opcional en UpdateCompraDto
        const { metodoPago, detalles: nuevosDetallesDto, idProveedor } = updateCompraDto as any; 

        // 1. Iniciar transacción
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 2. Obtener Compra existente
            const compraExistente = await queryRunner.manager.findOne(Compra, {
                where: { idCompra } as any,
                relations: ['detalles', 'detalles.producto', 'usuario', 'proveedor'], 
            });

            if (!compraExistente) {
              throw new NotFoundException(`Compra con ID ${idCompra} no encontrada.`);
            }

            // 2.b. Actualizar Proveedor si se proporciona
            if (idProveedor !== undefined) {
              const proveedor = await this.proveedorRepository.findOne(idProveedor);
              if (!proveedor) throw new NotFoundException('Proveedor no encontrado.');
              compraExistente.proveedor = proveedor;
              (compraExistente as any).idProveedor = idProveedor;
            }

            // ID del proveedor con el que se deben validar todos los productos 
            // (Será el nuevo ID si se actualizó, o el ID original si no se modificó)
            const currentIdProveedor = (compraExistente.proveedor as any).idProveedor;
            
            const detallesActuales: DetalleCompra[] = compraExistente.detalles || [];
            const productosAActualizar: { idProducto: number; cambioStock: number }[] = [];
            const detallesAProcesar: DetalleCompra[] = [];
            const detallesAEliminar: DetalleCompra[] = [];
            let nuevoTotal = 0;

            // 3. Procesar detalles solo si envían nuevos
            if (nuevosDetallesDto?.length) {
                for (const nuevoDetalleDto of nuevosDetallesDto) {
                    const idProducto = nuevoDetalleDto.idProducto;
                    const cantidadNueva = nuevoDetalleDto.cantidad;

                    if (idProducto === undefined || cantidadNueva === undefined) {
                        throw new BadRequestException('El idProducto y la cantidad son obligatorios para cada detalle de compra.');
                    }
                    
                    // NUEVA VALIDACIÓN CLAVE: Verificar si el Producto está asociado al Proveedor actual
                    const link = await this.productoProveedorService.checkLinkExists(idProducto, currentIdProveedor);
                    if (!link) {
                        throw new BadRequestException(
                            `El producto con ID ${idProducto} no está asociado al proveedor con ID ${currentIdProveedor}. La actualización no puede ser procesada.`
                        );
                    }

                    const detalleExistente = detallesActuales.find(d => (d as any).idProducto === idProducto);
                    const producto = await this.productoRepository.findOneActive(idProducto);
                    if (!producto) throw new NotFoundException(`Producto con ID ${idProducto} no encontrado.`);

                    const precioUnitario = producto.precio;
                    const subtotal = precioUnitario * cantidadNueva;
                    nuevoTotal += subtotal;

                    let cambioStock = 0;

                    if (detalleExistente) {
                        // MODIFICACIÓN: Nueva - Anterior (Positivo = SUMAR stock, Negativo = RESTAR stock)
                        cambioStock = cantidadNueva - detalleExistente.cantidad; 
                        
                        // VALIDACIÓN DE STOCK PARA LA REDUCCIÓN
                        if (cambioStock < 0 && producto.stock < Math.abs(cambioStock)) {
                            throw new BadRequestException(
                                `Stock insuficiente para reducir la cantidad comprada del producto "${producto.nombre}". Stock disponible: ${producto.stock}. Stock a remover: ${Math.abs(cambioStock)}.`
                            );
                        }

                        detalleExistente.cantidad = cantidadNueva;
                        detalleExistente.precioUnitario = precioUnitario;
                        detalleExistente.subtotal = subtotal;
                        detallesAProcesar.push(detalleExistente);
                    } else {
                        // NUEVO DETALLE: siempre suma stock
                        cambioStock = cantidadNueva; 
                        
                        const nuevoDetalle = new DetalleCompra();
                        (nuevoDetalle as any).idProducto = idProducto;
                        nuevoDetalle.producto = producto;
                        nuevoDetalle.cantidad = cantidadNueva;
                        nuevoDetalle.precioUnitario = precioUnitario;
                        nuevoDetalle.subtotal = subtotal;
                        nuevoDetalle.compra = compraExistente; 
                        detallesAProcesar.push(nuevoDetalle);
                    }

                    if (cambioStock !== 0) {
                        productosAActualizar.push({ idProducto, cambioStock });
                    }
                }

                // 4. Detectar detalles eliminados
                const idsNuevos = nuevosDetallesDto.map(d => d.idProducto);
                const eliminados = detallesActuales.filter(d => !idsNuevos.includes((d as any).idProducto));
                
                for (const detalle of eliminados) {
                    // Se resta el stock completo del detalle eliminado
                    const cambioStock = -detalle.cantidad; 

                    // Chequeo de nulo antes de acceder a las propiedades
                    const producto = await this.productoRepository.findOneActive((detalle as any).idProducto);
                    if (!producto) { 
                        throw new NotFoundException(
                            `Producto con ID ${(detalle as any).idProducto} asociado al detalle a eliminar no fue encontrado o está inactivo.`
                        );
                    }

                    // VALIDACIÓN DE STOCK PARA LA ELIMINACIÓN
                    if (producto.stock < Math.abs(cambioStock)) { 
                        throw new BadRequestException(
                            `Stock insuficiente para eliminar el detalle de compra del producto "${producto.nombre}". Stock disponible: ${producto.stock}. Stock a remover: ${detalle.cantidad}.`
                        );
                    }

                    productosAActualizar.push({ idProducto: (detalle as any).idProducto, cambioStock: cambioStock });
                    detallesAEliminar.push(detalle);
                }

                compraExistente.detalles = detallesAProcesar;
                compraExistente.total = nuevoTotal;
            } else {
                // 5. Si no hay nuevos detalles, mantener los existentes
                compraExistente.total = parseFloat(
                    detallesActuales.reduce((sum, d) => sum + Number(d.subtotal), 0).toFixed(2)
                );
            }

            // 6. Actualizar metodoPago si viene
            if (metodoPago !== undefined) {
                compraExistente.metodoPago = metodoPago;
            }

            // 7. Guardar Compra
            await queryRunner.manager.save(compraExistente);

            // 8. Eliminar detalles si los hay
            if (detallesAEliminar.length > 0) {
                await queryRunner.manager.remove(detallesAEliminar);
            }

            // 9. Actualizar stock
            for (const { idProducto, cambioStock } of productosAActualizar) {
                await this.productoRepository.updateStock(idProducto, cambioStock);
            }

            // 10. Commit
            await queryRunner.commitTransaction();

            //Auditar el proceso
            await this.auditoriaService.registrarEvento(
                compraExistente.usuario.id,
                EventosAuditoria.MODIFICAR_COMPRA,
                `El usuario ${compraExistente.usuario.email} ACTUALIZÓ una COMPRA con id ${compraExistente.idCompra}`,
            );

            // 11. Recargar Compra
            const compraActualizada = await this.compraRepository.findOne(idCompra);
            return plainToInstance(CompraResponseDto, compraActualizada, { excludeExtraneousValues: true });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            throw new BadRequestException('Error al actualizar la compra y el inventario: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }
}