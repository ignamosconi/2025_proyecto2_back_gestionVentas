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
        await this.marcaService.findOneActive(data.marcaId);
        
        let finalLineaId: number;

        // 2. Lógica de Creación Urgente (US 10)
        if (data.nombreNuevaLinea && data.lineaId) {
            throw new BadRequestException('Solo puede proporcionar un ID de línea existente O un nombre de línea nueva, no ambos.');
        }

        if (data.nombreNuevaLinea) {
            
            // 2.1. Creación de Línea
            const createLineaDto: CreateLineaDto = {
                nombre: data.nombreNuevaLinea,
                // Pasa marcaId para que LineaService cree el vínculo M:M (MarcaLinea)
                marcaId: data.marcaId, 
            };

            const nuevaLinea = await this.lineaService.create(createLineaDto);
            
            // Asigna el ID generado por la base de datos
            finalLineaId = nuevaLinea.id; 
            
        } else if (data.lineaId) {
            // USAR LÍNEA EXISTENTE
            
            // 2.1. Validar que la Línea exista
            await this.lineaService.findOneActive(data.lineaId); 
            
            // 2.2. VALIDACIÓN CRUCIAL DEL VÍNCULO M:M (MarcaLinea)
            // Obtiene todas las líneas vinculadas a la Marca
            const vinculos = await this.marcaLineaService.findAllByMarcaId(data.marcaId);
            
            // Chequea si la lineaId propuesta existe dentro de esos vínculos
            const vinculoExiste = vinculos.some(vinculo => vinculo.lineaId === data.lineaId);

            if (!vinculoExiste) {
                throw new BadRequestException(
                    `La Línea ID ${data.lineaId} no está vinculada a la Marca ID ${data.marcaId}.`
                );
            }
            
            finalLineaId = data.lineaId;
            
        } else {
            throw new BadRequestException('Debe vincular el producto a una línea existente o crear una nueva (US 10).');
        }

        // 3. Crear el producto (limpiar DTO y agregar FKs para la persistencia)
        const productoData: any = {
            ...data,
            idLinea: finalLineaId, 
            idMarca: data.marcaId, 
            
            // Excluir el campo de lógica
            nombreNuevaLinea: undefined,
        };

        return this.productoRepository.create(productoData);
    }
    
    async update(idProducto: number, data: UpdateProductoDto): Promise<Producto> {
        // Validación de existencia de IDs si vienen en el DTO de actualización
        if (data.lineaId) {
            await this.lineaService.findOneActive(data.lineaId);
        }
        if (data.marcaId) {
            await this.marcaService.findOneActive(data.marcaId);
        }
        
        return this.productoRepository.update(idProducto, data);
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

        // 1️⃣ Verificar que el producto exista
        const producto = await this.productoRepository.findOneActive(idProducto);
        if (!producto) {
            throw new NotFoundException(`Producto con ID ${idProducto} no encontrado.`);
        }

        // 2️⃣ Validar negocio (por ejemplo, evitar stock negativo)
        const nuevoStock = producto.stock + change;
        if (nuevoStock < 0) {
            throw new BadRequestException(
                `La operación dejaría el stock del producto en negativo (${nuevoStock}).`
            );
        }

        // 3️⃣ Delegar la actualización real al repositorio
        return this.productoRepository.updateStock(idProducto, change);
    }

    async findOneActive(id: number): Promise<Producto> {
        const producto = await this.findOne(id);
        if (!producto || producto.deletedAt) throw new NotFoundException(`Producto con id ${id} no encontrado o eliminado`);
        return producto;
    }


}