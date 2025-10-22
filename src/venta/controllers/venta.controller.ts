import { Controller, Get, Param, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { VentaControllerInterface } from './interfaces/venta.controller.interface';
import { VentaServiceInterface } from '../services/interfaces/venta.service.interface';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { Venta } from '../entities/venta.entity';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/helpers/enum.roles';
import { VENTA_SERVICE } from '../../constants';

@ApiTags('Ventas')
@Controller('ventas')
@UseGuards(AuthGuard, RolesGuard)
export class VentaController implements VentaControllerInterface {

    constructor(
        @Inject(VENTA_SERVICE)
        private readonly ventaService: VentaServiceInterface
    ) {}

    @Get()
    @Roles(UserRole.OWNER, UserRole.EMPLOYEE)
    @ApiOperation({ summary: 'Obtener todas las ventas (solo ADMIN y OWNER)' })
    findAll(): Promise<Venta[]> {
        console.log('[VentaController] GET /ventas - Obteniendo todas las ventas.');
        return this.ventaService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
    @ApiParam({ name: 'id', type: Number })
    @ApiOperation({ summary: 'Obtener una venta por ID (solo ADMIN y OWNER)' })
    findOne(@Param('id') id: number): Promise<Venta | null> {
        console.log(`[VentaController] GET /ventas/${id} - Obteniendo venta por ID.`);
        return this.ventaService.findOne(id);
    }

    @Get('usuario/:idUsuario')
    @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
    @ApiParam({ name: 'idUsuario', type: Number })
    @ApiOperation({ summary: 'Obtener todas las ventas de un usuario' })
    findByUsuario(@Param('idUsuario') idUsuario: number): Promise<Venta[]> {
        console.log(`[VentaController] GET /ventas/usuario/${idUsuario} - Obteniendo ventas del usuario.`);
        return this.ventaService.findByUsuario(idUsuario);
    }

    @Post()
    @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
    @HttpCode(HttpStatus.CREATED)
    @ApiBody({ type: CreateVentaDto })
    @ApiOperation({ summary: 'Crear una venta (usuario logueado)' })
    create(@Body() createVentaDto: CreateVentaDto, @Req() req: any): Promise<Venta> {
        const idUsuario = req.user.id; // Usuario logueado desde JWT o session
        console.log('[VentaController] POST /ventas - Creando venta con datos:', createVentaDto);
        return this.ventaService.create(createVentaDto, idUsuario);
    }
}
