// src/productos/controllers/producto.controller.ts

import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Param, 
    Body, 
    ParseIntPipe, 
    HttpCode,
    HttpStatus,
    UseGuards,
    Inject,
    Patch, 
    UseInterceptors,
    UploadedFile,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { UserRole } from '../../users/helpers/enum.roles'; 
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

import { Producto } from '../entities/producto.entity';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { ProductoControllerInterface } from './interfaces/producto.controller.interace';
import { ProductoServiceInterface } from '../services/interfaces/producto.service.interface';
import { PRODUCTO_SERVICE } from '../../constants';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createProductoWithImageSwagger } from '../docs/create-producto-with-image.doc';
import { updateProductoWithImageSwagger } from '../docs/update-producto-with-image.doc';
import { ParseJsonBodyPipe } from '../pipes/parse-json-body.pipe';

@ApiTags('Producto')
@Controller('producto')
@UseGuards(AuthGuard, RolesGuard) // Aplica autenticación y roles a todo el controlador
export class ProductoController implements ProductoControllerInterface {
    
    constructor(
        @Inject(PRODUCTO_SERVICE)
        private readonly productoService: ProductoServiceInterface,
    ) {}

    // ----------------------------------------------------
    // US 11: Alerta de Bajo Stock (Restringido a OWNER)
    // ----------------------------------------------------
    @Get('alerta-stock')
    @Roles(UserRole.OWNER) // Gestión de inventario
    @ApiOperation({ summary: 'US 11: Obtener productos con stock bajo.', description: 'Retorna productos donde el stock es menor o igual al umbral de alerta. Requiere rol OWNER.' })
    @ApiResponse({ status: 200, description: 'Lista de productos bajo alerta de stock.' })
    findLowStockProducts(): Promise<Producto[]> {
        console.log('[ProductoController] GET /producto/alerta-stock');
        return this.productoService.findLowStockProducts();
    }
    
    // ----------------------------------------------------
    // US 7: Lectura (Permitido a todos los autenticados)
    // ----------------------------------------------------

    @Get()
    @ApiOperation({ summary: 'US 7: Obtener todos los productos activos.' })
    findAll(): Promise<Producto[]> {
        // No necesita @Roles si está permitido a todos los autenticados
        console.log('[ProductoController] GET /producto');
        return this.productoService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'US 7: Obtener un producto activo por ID.' })
    @ApiParam({ name: 'id', description: 'ID del producto', type: Number })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Producto> {
        console.log(`[ProductoController] GET /producto/${id}`);
        return this.productoService.findOne(id);
    }
    
    // ----------------------------------------------------
    // US 7 & US 10: Creación (Restringido a OWNER)
    // Deberán hacer un POST con un FORM-DATA, que tenga
    // los campos 'file' (donde se adjuntará la imagen), y
    // 'data', donde se adjuntará un JSON del tipo create-producto.dto.ts
    // ----------------------------------------------------
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(UserRole.OWNER) // Restringido a OWNER
    @UseInterceptors(FileInterceptor('file')) //campo "file" en form-data
    @ApiConsumes('multipart/form-data') 
    @ApiBody(createProductoWithImageSwagger)
    async create(
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<Producto> {
        console.log('[ProductoController] POST /producto -> body:', body);
        return this.productoService.createWithImage(body, file);
    }

    // ----------------------------------------------------
    // US 7: Actualización (Restringido a OWNER)
    // ----------------------------------------------------
    
    // Usamos Patch o Put, pero Patch es común para actualizaciones parciales
    @Patch(':id') 
    @Roles(UserRole.OWNER) // Restringido a OWNER
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'US 7: Actualizar un producto existente.' })
    @ApiConsumes('multipart/form-data') 
    @ApiParam({ name: 'id', description: 'ID del producto a actualizar', type: Number })
    @ApiBody(updateProductoWithImageSwagger)
    async update(
        @Param('id', ParseIntPipe) id: number, 
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<Producto> {
        console.log(`[ProductoController] PATCH /producto/${id} -> body:`, body);
        return this.productoService.updateWithImage(id, body, file);
    }
    

    // PATCH /producto/:id/stock
    @Patch(':id/stock')
    @Roles(UserRole.OWNER) // Solo OWNER puede modificar stock
    @ApiOperation({ 
        summary: 'US 11: Actualizar stock de un producto.',
        description: 'Suma o resta stock de un producto. Requiere rol OWNER.'
    })
    @ApiParam({ name: 'id', description: 'ID del producto', type: Number })
    @ApiBody({ type: UpdateStockDto })
    updateStock(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateStockDto: UpdateStockDto
    ): Promise<Producto> {
        console.log(`[ProductoController] PATCH /producto/${id}/stock -> Body:`, updateStockDto);
        return this.productoService.updateStock(id, updateStockDto);
    }


    // ----------------------------------------------------
    // US 7: Eliminación Lógica (Soft Delete)
    // ----------------------------------------------------
    
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) 
    @Roles(UserRole.OWNER) // Restringido a OWNER
    @ApiOperation({ summary: 'US 7: Eliminar lógicamente un producto (Soft Delete).' })
    @ApiParam({ name: 'id', description: 'ID del producto a eliminar', type: Number })
    softDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        console.log(`[ProductoController] DELETE /producto/${id}`);
        return this.productoService.softDelete(id);
    }

    @Patch(':id/restore') // Usamos Patch/Put para la restauración, ya que es una modificación de estado
    @HttpCode(HttpStatus.OK)
    @Roles(UserRole.OWNER) // Restringido a OWNER
    @ApiOperation({ summary: 'US 7: Restaurar un producto eliminado lógicamente.' })
    @ApiParam({ name: 'id', description: 'ID del producto a restaurar', type: Number })
    restore(@Param('id', ParseIntPipe) id: number): Promise<void> {
        console.log(`[ProductoController] PATCH /producto/${id}/restore`);
        return this.productoService.restore(id);
    }
}