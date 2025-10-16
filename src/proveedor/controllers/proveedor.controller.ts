import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, HttpCode, HttpStatus, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/helpers/enum.roles';
import { ProveedorServiceInterface } from '../services/interfaces/proveedor.service.interface';
import { PROVEEDOR_SERVICE } from '../../constants';
import { ProveedorControllerInterface } from './interfaces/proveedor.controller.interface';
import { Proveedor } from '../entities/proveedor.entity';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';

@ApiTags('Proveedor')
@Controller('proveedor')
@UseGuards(AuthGuard, RolesGuard)
export class ProveedorController implements ProveedorControllerInterface {
    constructor(
        @Inject(PROVEEDOR_SERVICE)
        private readonly proveedorService: ProveedorServiceInterface
    ) {}

    @Get()
    @ApiOperation({ summary: 'Obtener todos los proveedores' })
    findAll(): Promise<Proveedor[]> {
        return this.proveedorService.findAll();
    }

    @Get(':id')
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Obtener un proveedor por ID' })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Proveedor> {
        return this.proveedorService.findOne(id);
    }

    @Post()
    @Roles(UserRole.OWNER)
    @HttpCode(HttpStatus.CREATED)
    @ApiBody({ type: CreateProveedorDto })
    @ApiOperation({ summary: 'Crear un proveedor (solo OWNER)' })
    create(@Body() data: CreateProveedorDto): Promise<Proveedor> {
        return this.proveedorService.create(data);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER)
    @ApiParam({ name: 'id', type: Number })
    @ApiBody({ type: UpdateProveedorDto })
    @ApiOperation({ summary: 'Actualizar un proveedor existente (solo OWNER)' })
    update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProveedorDto): Promise<Proveedor> {
        return this.proveedorService.update(id, data);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Eliminar lógicamente un proveedor (soft delete, solo OWNER)' })
    softDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.proveedorService.softDelete(id);
    }

    @Patch(':id/restore')
    @Roles(UserRole.OWNER)
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Restaurar un proveedor eliminado lógicamente (solo OWNER)' })
    restore(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.proveedorService.restore(id);
    }
}
