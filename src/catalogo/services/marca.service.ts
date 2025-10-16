// src/catalogo/services/marca.service.ts

import { 
    Injectable, 
    Inject, 
    BadRequestException, 
    NotFoundException, 
    ConflictException, // ✅ Reemplazamos Forbidden por Conflict, más apropiado para dependencias
} from '@nestjs/common';

// Interfaz que implementamos
import { MarcaServiceInterface } from './interfaces/marca.service.interface';

// ⚠️ Rutas de importación importantes:
import { MarcaRepositoryInterface } from '../repositories/interfaces/marca.repository.interface';
import { MARCA_REPOSITORY } from '../../constants'; // ✅ Asumo que agregaste PRODUCTOS_VALIDATOR a constants
//import { ProductosValidatorInterface } from '../../productos/interfaces/productos.validator.interface'; // ✅ Asumo la ruta de la interfaz de validación

import { Marca } from '../entities/marca.entity';
import { CreateMarcaDto } from '../dto/create-marca.dto';
import { UpdateMarcaDto } from '../dto/update-marca.dto';

@Injectable()
export class MarcaService implements MarcaServiceInterface { // ✅ Aseguramos la implementación
    constructor(
        // Inyección del token del repositorio (DIP)
        @Inject(MARCA_REPOSITORY)
        private readonly marcaRepository: MarcaRepositoryInterface,

        // ✅ NUEVO: Inyección del validador de productos (DIP)
       // @Inject(PRODUCTOS_VALIDATOR)
       // private readonly productosValidator: ProductosValidatorInterface,
    ) {}

// ---------------------------------------------------------------------
// MÉTODOS DE LECTURA (READ) (Sin cambios)
// ---------------------------------------------------------------------

    /**
     * Devuelve todas las marcas activas (no eliminadas suavemente).
     */
    async findAll(): Promise<Marca[]> {
        return this.marcaRepository.findAllActive();
    }
    
    /**
     * Devuelve una marca activa por ID. Lanza 404 si no existe.
     */
    async findOneActive(id: number): Promise<Marca> {
        const marca = await this.marcaRepository.findOneActive(id);
        if (!marca) {
            throw new NotFoundException(`Marca con ID ${id} no encontrada o está eliminada.`);
        }
        return marca;
    }

// ---------------------------------------------------------------------
// MÉTODOS DE ESCRITURA (CREATE, UPDATE, DELETE, RESTORE) (Lógica de softDelete modificada)
// ---------------------------------------------------------------------

    /**
     * Crea una nueva marca.
     */
    async create(data: CreateMarcaDto): Promise<Marca> {
        // Lógica de Negocio: 1. Validación de unicidad
        const existingMarca = await this.marcaRepository.findByName(data.nombre);
        if (existingMarca) {
            throw new BadRequestException(`El nombre de marca '${data.nombre}' ya existe en el sistema.`);
        }
        
        // 2. Delegación de la creación al repositorio
        return this.marcaRepository.create(data);
    }

    /**
     * Actualiza los datos de una marca existente.
     */
    async update(id: number, data: UpdateMarcaDto): Promise<Marca> {
        // Lógica de Negocio: 1. Validación de unicidad durante la actualización
        if (data.nombre) {
            const existingMarca = await this.marcaRepository.findByName(data.nombre);
            
            if (existingMarca && existingMarca.id !== id) {
                throw new BadRequestException(`El nombre de marca '${data.nombre}' ya está siendo usado por otra marca.`);
            }
        }
        
        // 2. Delegación de la actualización al repositorio.
        return this.marcaRepository.update(id, data);
    }
    
    /**
     * Realiza la eliminación suave de la marca.
     * ✅ RESTRICCIÓN: IMPEDIR ELIMINACIÓN si hay productos asociados.
     */
    async softDelete(id: number): Promise<void> {
        // 1. Validar que la marca exista y esté activa antes de verificar productos
        await this.findOneActive(id); 

        // 2. ✅ Lógica de Negocio: Verificar dependencia de productos
        //const hasProducts = await this.productosValidator.checkIfMarcaHasProducts(id);

        //if (hasProducts) {
            // 🛑 Lanza 409 Conflict si la marca tiene dependencias activas
           // throw new ConflictException(
            //    `No se puede eliminar la marca con ID ${id} porque tiene productos asociados. Debe desvincular los productos primero.`
            //);
        //}
        
        // 3. Delegación al repositorio
        await this.marcaRepository.softDelete(id);
    }
    
    /**
     * Restaura una marca previamente eliminada suavemente.
     */
    async restore(id: number): Promise<void> {
        // El repositorio se encarga de: restaurar el registro (deletedAt = NULL).
        await this.marcaRepository.restore(id);
    }
}