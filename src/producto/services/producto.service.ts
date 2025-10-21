// src/productos/services/producto.service.ts (COMPLETO)

import { 
    Injectable, 
    Inject, 
    NotFoundException, 
    ConflictException,
    BadRequestException
} from '@nestjs/common';
import { Producto } from '../entities/producto.entity';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { ProductoServiceInterface } from './interfaces/producto.service.interface';
import { ProductoRepositoryInterface } from '../repositories/interfaces/producto-interface.repository';
import { LineaServiceInterface } from '../../catalogo/services/interfaces/linea.service.interface';
import { MarcaServiceInterface } from '../../catalogo/services/interfaces/marca.service.interface';
import { MarcaLineaServiceInterface } from '../../catalogo/services/interfaces/marca-linea.service.interface'; 
import { CreateLineaDto } from '../../catalogo/dto/create-linea.dto'; // Asumimos esta ruta
import { 
    PRODUCTO_REPOSITORY, 
    LINEA_SERVICE,  
    MARCA_SERVICE,
    MARCA_LINEA_SERVICE 
} from '../../constants'; 
import { UpdateStockDto } from '../dto/update-stock.dto';
import { IUsersService } from 'src/users/interfaces/users.service.interface';
import { IMailerService } from 'src/mailer/interfaces/mailer.service.interface';
import { IS3Service } from 'src/s3/interfaces/s3.service.interface';
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
    ) {}

    // ---------------------------------------------------------------------
    // CONSULTAS (US 7)
    // ---------------------------------------------------------------------

    async findAll(): Promise<Producto[]> {
        return this.productoRepository.findAllActive();
    }

    async findOne(idProducto: number): Promise<Producto> {
        const producto = await this.productoRepository.findOneActive(idProducto);
        if (!producto) {
            // Buscamos si existe inactivo para dar un error más específico
            const inactivo = await this.productoRepository.findOneInactive(idProducto);
            if (inactivo) {
                throw new NotFoundException(`Producto con ID ${idProducto} está inactivo.`);
            }
            throw new NotFoundException(`Producto con ID ${idProducto} no encontrado.`);
        }
        return producto;
    }
    
    // ---------------------------------------------------------------------
    // CREACIÓN (US 7 & US 10) - Lógica de Vínculo M:M
    // ---------------------------------------------------------------------
    
    async create(data: CreateProductoDto): Promise<Producto> {
        // 1. Validar Marca (Debe existir)
        await this.marcaService.findOneActive(data.idMarca);
        
        let finalLineaId: number;

        // 2. Lógica de Creación Urgente (US 10)
        if (data.nombreNuevaLinea && data.idLinea) {
            throw new BadRequestException('Solo puede proporcionar un ID de línea existente O un nombre de línea nueva, no ambos.');
        }

        if (data.nombreNuevaLinea) {
            
            // 2.1. Creación de Línea
            const createLineaDto: CreateLineaDto = {
                nombre: data.nombreNuevaLinea,
                // Pasa marcaId para que LineaService cree el vínculo M:M (MarcaLinea)
                marcaId: data.idMarca, 
            };

            const nuevaLinea = await this.lineaService.create(createLineaDto);
            
            // Asigna el ID generado por la base de datos
            finalLineaId = nuevaLinea.id; 
            
        } else if (data.idLinea) {
            // USAR LÍNEA EXISTENTE
            
            // 2.1. Validar que la Línea exista
            await this.lineaService.findOneActive(data.idLinea); 
            
            // 2.2. VALIDACIÓN CRUCIAL DEL VÍNCULO M:M (MarcaLinea)
            // Obtiene todas las líneas vinculadas a la Marca
            const vinculos = await this.marcaLineaService.findAllByMarcaId(data.idMarca);
            
            // Chequea si la lineaId propuesta existe dentro de esos vínculos
            const vinculoExiste = vinculos.some(vinculo => vinculo.lineaId === data.idLinea);

            if (!vinculoExiste) {
                throw new BadRequestException(
                    `La Línea ID ${data.idLinea} no está vinculada a la Marca ID ${data.idMarca}.`
                );
            }
            
            finalLineaId = data.idLinea;
            
        } else {
            throw new BadRequestException('Debe vincular el producto a una línea existente o crear una nueva (US 10).');
        }

        // 3. Crear el producto (limpiar DTO y agregar FKs para la persistencia)
        const productoData: Partial<Producto> = {
            nombre: data.nombre,
            descripcion: data.descripcion,
            precio: data.precio,
            stock: data.stock,
            alertaStock: data.alertaStock,
            foto: data.foto,
            idLinea: finalLineaId,
            idMarca: data.idMarca,
        };

        return this.productoRepository.create(productoData);
    }

    async createWithImage(body: any, file?: Express.Multer.File): Promise<Producto> {
        // 1. Validar existencia del JSON
        if (!body || !body.data) {
            throw new BadRequestException('El campo "data" (JSON del producto) es obligatorio en el multipart/form-data.');
        }

        let createProductoDto: CreateProductoDto;
        try {
            const parsed = JSON.parse(body.data);
            
            // 2. Transformar y Validar manualmente
            const object = plainToInstance(CreateProductoDto, parsed);
            
            const errors = await validate(object as object, { 
                // Usamos las mismas reglas de validación
                whitelist: true, 
                forbidNonWhitelisted: true,
                stopAtFirstError: false 
            });

            if (errors.length > 0) {
                const errorMessages = errors.flatMap(error => Object.values(error.constraints || {}));
                throw new BadRequestException(errorMessages);
            }
            
            // 3. Asignar el DTO validado
            createProductoDto = object as CreateProductoDto;

        } catch (error) {
            // Manejar errores de JSON.parse o errores de validación
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('El campo "data" debe ser un string JSON válido.');
        }

        // 4. Continuar con la lógica del servicio (reutilizando el método 'create')
        const producto = await this.create(createProductoDto); // Aquí se llama al método create(CreateProductoDto)

        // 5. Si hay imagen, subirla y actualizar el producto con la URL
        if (file) {
            const result = await this.s3Service.uploadFile(file.buffer, file.originalname, producto.idProducto);
            await this.productoRepository.update(producto.idProducto, { foto: result.url });

            producto.foto = result.url;
        }

        return producto;
    }

    // ---------------------------------------------------------------------
    // ACTUALIZACIÓN DE PRODUCTOS
    // ---------------------------------------------------------------------
    async update(idProducto: number, data: UpdateProductoDto): Promise<Producto> {
        // 0. Encontrar el producto existente para obtener sus IDs actuales
        // Esto es necesario si solo actualizamos una FK (ej. solo idLinea) para validar con la otra FK.
        const productoExistente = await this.productoRepository.findOneActive(idProducto);

        if (!productoExistente) {
            throw new NotFoundException(`Producto con ID ${idProducto} no encontrado o inactivo.`);
        }   
    
        // 1. Validar existencia de IDs si vienen en el DTO de actualización
        const idLineaFinal = data.idLinea || productoExistente.idLinea; // Usar el nuevo ID o el existente
        const idMarcaFinal = data.idMarca || productoExistente.idMarca; // Usar el nuevo ID o el existente

        if (data.idLinea) {
            // 1.1. Validar que la Línea exista
            await this.lineaService.findOneActive(data.idLinea);
        }
        if (data.idMarca) {
            // 1.2. Validar que la Marca exista
            await this.marcaService.findOneActive(data.idMarca);
        }
        
        // 2. VALIDACIÓN DEL VÍNCULO M:M (MarcaLinea)
        // Solo se valida si AL MENOS una de las FKs se envió o si AMBAS son requeridas para la persistencia.
        // En el PATCH, se debe verificar la nueva combinación: idMarcaFinal y idLineaFinal
        
        // 2.1. Obtener los vínculos de la Marca FINAL
        const vinculos = await this.marcaLineaService.findAllByMarcaId(idMarcaFinal);
        
        // 2.2. Chequea si la Línea FINAL existe dentro de esos vínculos
        const vinculoExiste = vinculos.some(vinculo => vinculo.lineaId === idLineaFinal);

        if (!vinculoExiste) {
            throw new BadRequestException(
                `La Línea ID ${idLineaFinal} no está vinculada a la Marca ID ${idMarcaFinal}.`
            );
        }

        // 3. Persistencia
        // Si no se envió idMarca o idLinea, el DTO de PATCH es suficiente.
        // Si se enviaron, ya validamos su consistencia y existencia.
        return this.productoRepository.update(idProducto, data);
    }

    async updateWithImage(idProducto: number, body: any, file?: Express.Multer.File): Promise<Producto> {
        // 1. Validar existencia del JSON
        if (!body || !body.data) {
            // En un PATCH, data podría ser opcional, pero aquí lo requerimos si se usa multipart
            throw new BadRequestException('El campo "data" (JSON del producto) es obligatorio en el multipart/form-data para actualizar.');
        }

        let updateProductoDto: UpdateProductoDto;
        try {
            const parsed = JSON.parse(body.data);
            
            // 2. Transformar y Validar manualmente. Usamos UpdateProductoDto aquí
            const object = plainToInstance(UpdateProductoDto, parsed); 
            
            const errors = await validate(object as object, { 
                whitelist: true, 
                forbidNonWhitelisted: true,
                skipMissingProperties: true, // Ignoramos los campos no enviados
                stopAtFirstError: false 
            });

            if (errors.length > 0) {
                const errorMessages = errors.flatMap(error => Object.values(error.constraints || {}));
                throw new BadRequestException(errorMessages);
            }
            
            // 3. Asignar el DTO validado
            updateProductoDto = object as UpdateProductoDto;

        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('El campo "data" debe ser un string JSON válido.');
        }

        // 4. Actualizar el producto (reutilizamos el método 'update')
        const productoActualizado = await this.update(idProducto, updateProductoDto); 

        // 5. Si hay imagen, subirla y actualizar la URL
        if (file) {
            const result = await this.s3Service.uploadFile(file.buffer, file.originalname, idProducto);
            await this.productoRepository.update(idProducto, { foto: result.url });

            productoActualizado.foto = result.url;
        }

        return productoActualizado;
    }


    // ---------------------------------------------------------------------
    // SOFT DELETE (US 7)
    // ---------------------------------------------------------------------

    async softDelete(idProducto: number): Promise<void> {
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

    async updateStock(idProducto: number, updateStockDto: UpdateStockDto): Promise<Producto> {
        const { change } = updateStockDto;

        const producto = await this.productoRepository.findOneActive(idProducto);
        if (!producto) {
            throw new NotFoundException(`Producto con ID ${idProducto} no encontrado.`);
        }

        const nuevoStock = producto.stock + change;
        if (nuevoStock < 0) {
            throw new BadRequestException(
                `La operación dejaría el stock del producto en negativo (${nuevoStock}).`
            );
        }

        // Validar si está por debajo del límite de alerta
        const stockBajo = nuevoStock <= producto.alertaStock;

        // 1 - Actualizar el stock real
        const productoActualizado = await this.productoRepository.updateStock(idProducto, change);

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
                    `
                );
            }
        }

        return productoActualizado;
    }

    async findOneActive(id: number): Promise<Producto> {
        const producto = await this.findOne(id);
        if (!producto || producto.deletedAt) throw new NotFoundException(`Producto con id ${id} no encontrado o eliminado`);
        return producto;
    }


}