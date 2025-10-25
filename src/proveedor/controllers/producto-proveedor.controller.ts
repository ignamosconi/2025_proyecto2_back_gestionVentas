import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/helpers/enum.roles';
import type { ProductoProveedorServiceInterface } from '../services/interfaces/producto-proveedor.service.interface';
import { PRODUCTO_PROVEEDOR_SERVICE } from '../../constants';
import type { ProductoProveedorControllerInterface } from './interfaces/producto-proveedor.controller.interface';
import { ProductoProveedor } from '../entities/producto-proveedor.entity';
import { CreateProductoProveedorDto } from '../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../dto/update-producto-proveedor.dto';

@ApiTags('ProductoProveedor')
@Controller('producto-proveedor')
@UseGuards(AuthGuard, RolesGuard)
export class ProductoProveedorController
  implements ProductoProveedorControllerInterface
{
  constructor(
    @Inject(PRODUCTO_PROVEEDOR_SERVICE)
    private readonly productoProveedorService: ProductoProveedorServiceInterface,
  ) {}

  @Get()
  findAll(): Promise<ProductoProveedor[]> {
    console.log(
      `[ProductoProveedorController] GET /producto-proveedor - Obteniendo todos los vínculos Producto-Proveedor.`,
    );
    return this.productoProveedorService.findAll();
  }

  @ApiOperation({
    summary: 'Obtiene los vínculos Producto-Proveedor eliminados lógicamente',
  })
  @Get('deleted')
  @Roles(UserRole.OWNER) // Solo el dueño puede ver los eliminados
  findAllSoftDeleted(): Promise<ProductoProveedor[]> {
    console.log(
      `[ProductoProveedorController] GET /producto-proveedor/deleted - Obteniendo vínculos eliminados lógicamente.`,
    );
    return this.productoProveedorService.findAllSoftDeleted();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductoProveedor> {
    console.log(
      `[ProductoProveedorController] GET /producto-proveedor/${id} - Obteniendo vínculo por ID.`,
    );
    return this.productoProveedorService.findOne(id);
  }

  @Get('check/:idProducto/:idProveedor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifica si un Producto ya está vinculado a un Proveedor.',
    description:
      'Retorna { exists: true } si el vínculo existe, { exists: false } si no.',
  })
  @ApiParam({
    name: 'idProducto',
    description: 'ID del Producto.',
    type: Number,
  })
  @ApiParam({
    name: 'idProveedor',
    description: 'ID del Proveedor.',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del vínculo retornado.',
    schema: { example: { exists: true } },
  })
  async checkLink(
    @Param('idProducto', ParseIntPipe) idProducto: number,
    @Param('idProveedor', ParseIntPipe) idProveedor: number,
  ): Promise<{ exists: boolean }> {
    console.log(
      `[ProductoProveedorController] GET /producto-proveedor/check/${idProducto}/${idProveedor} - Verificando vínculo.`,
    );

    const link = await this.productoProveedorService.checkLinkExists(
      idProducto,
      idProveedor,
    );

    // Convierte el resultado (entidad o null) en un booleano
    return { exists: !!link };
  }

  @Get('producto/:idProducto')
  @ApiParam({ name: 'idProducto', type: Number })
  findByProducto(
    @Param('idProducto', ParseIntPipe) idProducto: number,
  ): Promise<ProductoProveedor[]> {
    console.log(
      `[ProductoProveedorController] GET /producto-proveedor/producto/${idProducto} - Obteniendo vínculos por Producto.`,
    );
    return this.productoProveedorService.findByProducto(idProducto);
  }

  @Get('proveedor/:idProveedor')
  @ApiParam({ name: 'idProveedor', type: Number })
  findByProveedor(
    @Param('idProveedor', ParseIntPipe) idProveedor: number,
  ): Promise<ProductoProveedor[]> {
    console.log(
      `[ProductoProveedorController] GET /producto-proveedor/proveedor/${idProveedor} - Obteniendo vínculos por Proveedor.`,
    );
    return this.productoProveedorService.findByProveedor(idProveedor);
  }

  @Post()
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateProductoProveedorDto })
  create(@Body() data: CreateProductoProveedorDto): Promise<ProductoProveedor> {
    console.log(
      `[ProductoProveedorController] POST /producto-proveedor - Creando vínculo con datos:`,
      data,
    );
    return this.productoProveedorService.create(data);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateProductoProveedorDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateProductoProveedorDto,
  ): Promise<ProductoProveedor> {
    console.log(
      `[ProductoProveedorController] PATCH /producto-proveedor/${id} - Actualizando vínculo con datos:`,
      data,
    );
    return this.productoProveedorService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    console.log(
      `[ProductoProveedorController] DELETE /producto-proveedor/${id} - Eliminando vínculo lógicamente.`,
    );
    return this.productoProveedorService.softDelete(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  restore(@Param('id', ParseIntPipe) id: number): Promise<void> {
    console.log(
      `[ProductoProveedorController] PATCH /producto-proveedor/${id}/restore - Restaurando vínculo eliminado.`,
    );
    return this.productoProveedorService.restore(id);
  }
}
