// src/productos/services/producto.service.ts (COMPLETO)

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Producto } from '../entities/producto.entity';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { ProductoServiceInterface } from './interfaces/producto.service.interface';
import { ProductoRepositoryInterface } from '../repositories/interfaces/producto-interface.repository';
import { ProductoProveedorRepositoryInterface } from '../../proveedor/repositories/interfaces/producto-proveedor.repository.interface';
import { LineaServiceInterface } from '../../catalogo/services/interfaces/linea.service.interface';
import { MarcaServiceInterface } from '../../catalogo/services/interfaces/marca.service.interface';
import { MarcaLineaServiceInterface } from '../../catalogo/services/interfaces/marca-linea.service.interface';
import { CreateLineaDto } from '../../catalogo/dto/create-linea.dto';
import {
  PRODUCTO_REPOSITORY,
  LINEA_SERVICE,
  MARCA_SERVICE,
  MARCA_LINEA_SERVICE,
  PRODUCTO_PROVEEDOR_REPOSITORY,
} from '../../constants';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { IUsersService } from '../../users/interfaces/users.service.interface';
import { IMailerService } from '../../mailer/interfaces/mailer.service.interface';
import { IS3Service } from '../../s3/interfaces/s3.service.interface';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ProductoService implements ProductoServiceInterface {
  constructor(
    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepository: ProductoRepositoryInterface,
    @Inject(MARCA_SERVICE)
    private readonly marcaService: MarcaServiceInterface,
    @Inject(LINEA_SERVICE)
    private readonly lineaService: LineaServiceInterface,
    @Inject(MARCA_LINEA_SERVICE)
    private readonly marcaLineaService: MarcaLineaServiceInterface,
    @Inject('IUsersService')
    private readonly usersService: IUsersService,
    @Inject('IMailerService')
    private readonly mailerService: IMailerService,
    @Inject('IS3Service')
    private readonly s3Service: IS3Service,
    @Inject(PRODUCTO_PROVEEDOR_REPOSITORY)
    private readonly productoProveedorRepository: ProductoProveedorRepositoryInterface,
  ) {}

  // ---------------------------------------------------------------------
  // MÉTODOS PRIVADOS - Imágenes con S3 y Validación de DTO
  // ---------------------------------------------------------------------

  private async handleImageUpload(
    idProducto: number,
    file?: Express.Multer.File,
  ): Promise<string | null> {
    if (file) {
      const result = await this.s3Service.uploadFile(
        file.buffer,
        file.originalname,
        idProducto,
      );
      await this.productoRepository.update(idProducto, { foto: result.url });
      return result.url;
    }
    return null;
  }

  private async validateBodyToDto<T extends object>(
    body: any,
    dtoClass: new () => T,
    skipMissingProperties: boolean = false,
  ): Promise<T> {
    if (!body || !body.data) {
      throw new BadRequestException(
        'El campo "data" (JSON del producto) es obligatorio.',
      );
    }

    try {
      const parsed = JSON.parse(body.data);
      const object = plainToInstance(dtoClass, parsed);

      const errors = await validate(object, {
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: skipMissingProperties,
        stopAtFirstError: false,
      });

      if (errors.length > 0) {
        const errorMessages = errors.flatMap((error) =>
          Object.values(error.constraints || {}),
        );
        throw new BadRequestException(errorMessages);
      }

      return object as T;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'El campo "data" debe ser un string JSON válido.',
      );
    }
  }

  // ----------------------------------------------------------------------------
  // MÉTODOS PRIVADOS - Implementación US 10 para la creación y actualización
  //  -validateLineAndMarkForCreation: validación idLínea/idMarca para crear
  //  -validateLineAndMarkForUpdate: validación idLínea/idMarca para actualizar
  // ----------------------------------------------------------------------------
  private async validateLineAndMarkForCreation(
    data: CreateProductoDto,
  ): Promise<number> {
    // 1. Validar Marca
    await this.marcaService.findOneActive(data.idMarca);

    if (data.nombreNuevaLinea && data.idLinea) {
      throw new BadRequestException(
        'Solo puede proporcionar un ID de línea existente O un nombre de línea nueva, no ambos.',
      );
    }

    if (data.nombreNuevaLinea) {
      // Creación de Línea
      const createLineaDto: CreateLineaDto = {
        nombre: data.nombreNuevaLinea,
        marcaId: data.idMarca,
      };

      const nuevaLinea = await this.lineaService.create(createLineaDto);

      //Creamos la relación entre la línea y marca que acaban de generar.
      const createMarcaLineaDto = {
        marcaId: data.idMarca,
        lineaId: nuevaLinea.id,
      };
      await this.marcaLineaService.assignLineaToMarca(createMarcaLineaDto);

      return nuevaLinea.id;
    }

    if (data.idLinea) {
      // Uso de Línea Existente
      await this.lineaService.findOneActive(data.idLinea);

      // VALIDACIÓN CRUCIAL DEL VÍNCULO M:M
      const vinculos = await this.marcaLineaService.findAllByMarcaId(
        data.idMarca,
      );
      const vinculoExiste = vinculos.some(
        (vinculo) => vinculo.lineaId === data.idLinea,
      );

      if (!vinculoExiste) {
        throw new BadRequestException(
          `La Línea ID ${data.idLinea} no está vinculada a la Marca ID ${data.idMarca}.`,
        );
      }
      return data.idLinea;
    }

    throw new BadRequestException(
      'Debe vincular el producto a una línea existente o crear una nueva (US 10).',
    );
  }

  private async validateLineAndMarkForUpdate(
    idProducto: number,
    data: UpdateProductoDto,
  ): Promise<{ idLineaFinal: number; idMarcaFinal: number }> {
    const productoExistente =
      await this.productoRepository.findOneActive(idProducto);

    if (!productoExistente) {
      throw new NotFoundException(
        `Producto con ID ${idProducto} no encontrado o inactivo.`,
      );
    }

    const idLineaFinal = data.idLinea || productoExistente.idLinea;
    const idMarcaFinal = data.idMarca || productoExistente.idMarca;

    // Validar que la nueva Línea/Marca exista si se enviaron
    if (data.idLinea) {
      await this.lineaService.findOneActive(data.idLinea);
    }
    if (data.idMarca) {
      await this.marcaService.findOneActive(data.idMarca);
    }

    // VALIDACIÓN CRUCIAL DEL VÍNCULO M:M (MarcaLinea)
    const vinculos =
      await this.marcaLineaService.findAllByMarcaId(idMarcaFinal);
    const vinculoExiste = vinculos.some(
      (vinculo) => vinculo.lineaId === idLineaFinal,
    );

    if (!vinculoExiste) {
      throw new BadRequestException(
        `La Línea ID ${idLineaFinal} no está vinculada a la Marca ID ${idMarcaFinal}.`,
      );
    }

    return { idLineaFinal, idMarcaFinal };
  }

  // ---------------------------------------------------------------------
  // CONSULTAS (US 7)
  // ---------------------------------------------------------------------

  async findAll(): Promise<Producto[]> {
    return this.productoRepository.findAllActive();
  }

  async findAllSoftDeleted(): Promise<Producto[]> {
    return this.productoRepository.findAllSoftDeleted();
  }

  async findOne(idProducto: number): Promise<Producto> {
    const producto = await this.productoRepository.findOneActive(idProducto);
    if (!producto) {
      // Buscamos si existe inactivo para dar un error más específico
      const inactivo =
        await this.productoRepository.findOneInactive(idProducto);
      if (inactivo) {
        throw new NotFoundException(
          `Producto con ID ${idProducto} está inactivo.`,
        );
      }
      throw new NotFoundException(
        `Producto con ID ${idProducto} no encontrado.`,
      );
    }
    return producto;
  }

  // ---------------------------------------------------------------------
  // CREACIÓN (US 7 & US 10) - Lógica de Vínculo M:M
  // ---------------------------------------------------------------------
  async create(body: any, file?: Express.Multer.File): Promise<Producto> {
    // 1. Validar DTO
    const data: CreateProductoDto = await this.validateBodyToDto(
      body,
      CreateProductoDto,
    );

    // 2. Lógica de Negocios (Encapsulada en helper)
    const finalLineaId = await this.validateLineAndMarkForCreation(data);

    // 3. Crear el producto
    const productoData: Partial<Producto> = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      stock: data.stock,
      alertaStock: data.alertaStock,
      foto: data.foto,
      idLinea: finalLineaId, // Usamos el ID final
      idMarca: data.idMarca,
    };
    const producto = await this.productoRepository.create(productoData);

    // 4. Subir imagen
    await this.handleImageUpload(producto.idProducto, file);

    // 5. Obtener el producto creado con la imagen
    const productoCreado = await this.productoRepository.findOneActive(
      producto.idProducto,
    );

    if (!productoCreado) {
      throw new NotFoundException(
        `Producto con ID ${producto.idProducto} no encontrado después de crear.`,
      );
    }

    return productoCreado;
  }

  // ---------------------------------------------------------------------
  // ACTUALIZACIÓN DE PRODUCTOS
  // ---------------------------------------------------------------------
  async update(
    idProducto: number,
    body: any,
    file?: Express.Multer.File,
  ): Promise<Producto> {
    // 1. Validar DTO
    const data: UpdateProductoDto = await this.validateBodyToDto(
      body,
      UpdateProductoDto,
      true,
    );

    // 2. Lógica de Negocios (Encapsulada en helper)
    // Este método valida el producto, pero no necesitamos usar los IDs finales para la persistencia
    // ya que data (UpdateProductoDto) puede contenerlos o no.
    // Solo lo llamamos para que lance las excepciones si hay error.
    await this.validateLineAndMarkForUpdate(idProducto, data);

    // 3. Persistencia de los datos
    await this.productoRepository.update(idProducto, data);

    // 4. Subir imagen
    await this.handleImageUpload(idProducto, file);

    // 5. Obtener el producto actualizado con la nueva imagen
    const productoActualizado =
      await this.productoRepository.findOneActive(idProducto);

    if (!productoActualizado) {
      throw new NotFoundException(
        `Producto con ID ${idProducto} no encontrado después de actualizar.`,
      );
    }

    return productoActualizado;
  }

  // ---------------------------------------------------------------------
  // SOFT DELETE (US 7)
  // ---------------------------------------------------------------------

  async softDelete(idProducto: number): Promise<void> {
    // Verificar si el producto tiene proveedores asociados
    const proveedoresAsociados =
      await this.productoProveedorRepository.findByProducto(idProducto);

    if (proveedoresAsociados && proveedoresAsociados.length > 0) {
      throw new ConflictException(
        `No se puede eliminar el producto porque tiene ${proveedoresAsociados.length} proveedor(es) asociado(s). ` +
          `Primero debe desasociar todos los proveedores.`,
      );
    }

    await this.productoRepository.softDelete(idProducto);
  }

  async restore(idProducto: number): Promise<void> {
    await this.productoRepository.restore(idProducto);
  }

  // ---------------------------------------------------------------------
  // ALERTA DE BAJO STOCK (US 11)
  // ---------------------------------------------------------------------

  async findLowStockProducts(): Promise<Producto[]> {
    return this.productoRepository.findLowStockProducts();
  }

  async updateStock(
    idProducto: number,
    updateStockDto: UpdateStockDto,
  ): Promise<Producto> {
    const { change } = updateStockDto;

    const producto = await this.productoRepository.findOneActive(idProducto);
    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${idProducto} no encontrado.`,
      );
    }

    const nuevoStock = producto.stock + change;
    if (nuevoStock < 0) {
      throw new BadRequestException(
        `La operación dejaría el stock del producto en negativo (${nuevoStock}).`,
      );
    }

    // Validar si está por debajo del límite de alerta
    const stockBajo = nuevoStock <= producto.alertaStock;

    // 1 - Actualizar el stock real
    const productoActualizado = await this.productoRepository.updateStock(
      idProducto,
      change,
    );

    // 2 - Si hay alerta, enviar mail
    if (stockBajo) {
      // Obtener usuarios EMPLOYER
      const employers = await this.usersService.findAllOwners(); // <- Inyectar este servicio

      // Enviar un mail a cada uno
      for (const user of employers) {
        await this.mailerService.sendMail(
          user.email,
          `⚠️ Alerta de Stock Bajo: ${producto.nombre}`,
          `
                    <h2>⚠️ Producto con Stock Crítico</h2>
                    <p>El producto <strong>${producto.nombre}</strong> tiene un stock actual de <strong>${nuevoStock}</strong>.</p>
                    <p>El umbral de alerta configurado es <strong>${producto.alertaStock}</strong>.</p>
                    <hr/>
                    <p>Revisá el inventario lo antes posible.</p>
                    `,
        );
      }
    }

    return productoActualizado;
  }

  async findOneActive(id: number): Promise<Producto> {
    const producto = await this.findOne(id);
    if (!producto || producto.deletedAt)
      throw new NotFoundException(
        `Producto con id ${id} no encontrado o eliminado`,
      );
    return producto;
  }
}
