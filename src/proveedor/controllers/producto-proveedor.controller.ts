import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, HttpCode, HttpStatus, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/helpers/enum.roles';
import { ProductoProveedorServiceInterface } from '../services/interfaces/producto-proveedor.service.interface';
import { PRODUCTO_PROVEEDOR_SERVICE } from '../../constants';
import { ProductoProveedorControllerInterface } from './interfaces/producto-proveedor.controller.interface';
import { ProductoProveedor } from '../entities/producto-proveedor.entity';
import { CreateProductoProveedorDto } from '../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../dto/update-producto-proveedor.dto';

@ApiTags('ProductoProveedor')
@Controller('producto-proveedor')
@UseGuards(AuthGuard, RolesGuard)
export class ProductoProveedorController implements ProductoProveedorControllerInterface {
    constructor(
        @Inject(PRODUCTO_PROVEEDOR_SERVICE)
        private readonly productoProveedorService: ProductoProveedorServiceInterface
    ) {}

    @Get()
    findAll(): Promise<ProductoProveedor[]> {
        return this.productoProveedorService.findAll();
    }

    @Get(':id')
    @ApiParam({ name: 'id', type: Number })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductoProveedor> {
        return this.productoProveedorService.findOne(id);
    }

    @Get('producto/:idProducto')
    @ApiParam({ name: 'idProducto', type: Number })
    findByProducto(@Param('idProducto', ParseIntPipe) idProducto: number): Promise<ProductoProveedor[]> {
        return this.productoProveedorService.findByProducto(idProducto);
    }

    @Get('proveedor/:idProveedor')
    @ApiParam({ name: 'idProveedor', type: Number })
    findByProveedor(@Param('idProveedor', ParseIntPipe) idProveedor: number): Promise<ProductoProveedor[]> {
        return this.productoProveedorService.findByProveedor(idProveedor);
    }

    @Post()
    @Roles(UserRole.OWNER)
    @HttpCode(HttpStatus.CREATED)
    @ApiBody({ type: CreateProductoProveedorDto })
    create(@Body() data: CreateProductoProveedorDto): Promise<ProductoProveedor> {
        return this.productoProveedorService.create(data);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER)
    @ApiParam({ name: 'id', type: Number })
    @ApiBody({ type: UpdateProductoProveedorDto })
    update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductoProveedorDto): Promise<ProductoProveedor> {
        return this.productoProveedorService.update(id, data);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'id', type: Number })
    delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.productoProveedorService.softDelete(id);
    }

    @Patch(':id/restore')
    @Roles(UserRole.OWNER)
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', type: Number })
    restore(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.productoProveedorService.restore(id);
    }
}
