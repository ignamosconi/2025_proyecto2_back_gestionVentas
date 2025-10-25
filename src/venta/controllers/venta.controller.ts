import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import type { VentaServiceInterface } from '../services/interfaces/venta.service.interface';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { VentaResponseDto } from '../dto/venta-response.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/helpers/enum.roles';
import { VENTA_SERVICE } from '../../constants';
import { UpdateVentaDto } from '../dto/update-venta.dto';
import type { VentaControllerInterface } from './interfaces/venta.controller.interface';

@ApiTags('Ventas')
@Controller('ventas')
@UseGuards(AuthGuard, RolesGuard)
export class VentaController implements VentaControllerInterface {
  // Usar la clase Logger de NestJS en lugar de console.log
  private readonly logger = new Logger(VentaController.name);

  constructor(
    @Inject(VENTA_SERVICE)
    private readonly ventaService: VentaServiceInterface,
  ) {}

  // -------------------------------------------------------------------------------
  // MÉTODOS DE LECTURA (GET)
  // -------------------------------------------------------------------------------

  @Get()
  @Roles(UserRole.OWNER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Obtener todas las ventas (solo ADMIN y OWNER)' })
  findAll(): Promise<VentaResponseDto[]> {
    this.logger.log('--- ENTRADA A findAll ---');
    return this.ventaService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Obtener una venta por ID' })
  findOne(@Param('id') id: number): Promise<VentaResponseDto | null> {
    this.logger.log(`--- ENTRADA A findOne ---`);
    this.logger.debug(`Parámetro (ID): ${id}`);
    return this.ventaService.findOne(id);
  }

  @Get('usuario/:idUsuario')
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
  @ApiParam({ name: 'idUsuario', type: Number })
  @ApiOperation({ summary: 'Obtener todas las ventas de un usuario' })
  findByUsuario(
    @Param('idUsuario') idUsuario: number,
  ): Promise<VentaResponseDto[]> {
    this.logger.log(`--- ENTRADA A findByUsuario ---`);
    this.logger.debug(`Parámetro (ID Usuario): ${idUsuario}`);
    return this.ventaService.findByUsuario(idUsuario);
  }

  // -------------------------------------------------------------------------------
  // MÉTODOS DE ESCRITURA (POST/PUT)
  // -------------------------------------------------------------------------------

  @Post()
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateVentaDto })
  @ApiOperation({ summary: 'Crear una venta' })
  create(
    @Body() createVentaDto: CreateVentaDto,
    @Req() req: any,
  ): Promise<VentaResponseDto> {
    const userId = req.user.id; // usuario autenticado
    this.logger.log(`--- ENTRADA A create (POST) ---`);
    this.logger.debug(`ID de Usuario Autenticado: ${userId}`);
    this.logger.debug(
      `Body (DTO de Creación): ${JSON.stringify(createVentaDto)}`,
    );
    return this.ventaService.create(createVentaDto, userId);
  }

  @Put(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la venta a actualizar',
  })
  @ApiBody({ type: UpdateVentaDto })
  @ApiOperation({ summary: 'Actualizar una venta existente (gestiona stock)' })
  update(
    @Param('id') id: number,
    @Body() updateVentaDto: UpdateVentaDto,
  ): Promise<VentaResponseDto> {
    this.logger.log(`--- ENTRADA A update (PUT) ---`);
    this.logger.debug(`Parámetro (ID Venta): ${id}`);
    this.logger.debug(
      `Body (DTO de Actualización): ${JSON.stringify(updateVentaDto)}`,
    );
    return this.ventaService.update(id, updateVentaDto);
  }
}
