// 📄 src/compras/controllers/compra.controller.ts

import { Controller, Get, Param, Post, Body, Req, UseGuards, HttpCode, HttpStatus, Put, Inject, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';

// Interfaces y DTOs de Compra
import { CompraServiceInterface } from '../services/interfaces/compra.service.interface';
import { CompraControllerInterface } from './interface/compra.controller.interface';
import { CreateCompraDto } from '../dto/create-compra.dto';
import { UpdateCompraDto } from '../dto/update-compra.dto';
import { CompraResponseDto } from '../dto/compra-response.dto';

// Módulos Compartidos (Asumiendo las rutas)
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/helpers/enum.roles'; 
import { COMPRA_SERVICE } from '../../constants'; 


@ApiTags('Compras')
@Controller('compras')
// Aplicar Guards de autenticación y roles a nivel de controlador
@UseGuards(AuthGuard, RolesGuard) 
export class CompraController implements CompraControllerInterface {

    private readonly logger = new Logger(CompraController.name);

    constructor(
      @Inject(COMPRA_SERVICE) // Inyección del CompraService
      private readonly compraService: CompraServiceInterface
    ) {}

// -------------------------------------------------------------------------------
// MÉTODOS DE LECTURA (GET)
// -------------------------------------------------------------------------------

  @Get()
  @Roles(UserRole.OWNER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Obtener todas las compras (solo EMPLEADO y OWNER)' })
  findAll(): Promise<CompraResponseDto[]> {
    this.logger.log('--- ENTRADA A findAll ---');
    return this.compraService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
  @ApiParam({ name: 'id', type: Number, description: 'ID de la compra' })
  @ApiOperation({ summary: 'Obtener una compra por ID' })
  findOne(@Param('id') id: number): Promise<CompraResponseDto | null> {
    this.logger.log(`--- ENTRADA A findOne ---`);
    this.logger.debug(`Parámetro (ID): ${id}`);
    return this.compraService.findOne(id);
  }

  @Get('usuario/:idUsuario')
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
  @ApiParam({ name: 'idUsuario', type: Number, description: 'ID del usuario que registró la compra' })
  @ApiOperation({ summary: 'Obtener todas las compras registradas por un usuario' })
  findByUsuario(@Param('idUsuario') idUsuario: number): Promise<CompraResponseDto[]> {
    this.logger.log(`--- ENTRADA A findByUsuario ---`);
    this.logger.debug(`Parámetro (ID Usuario): ${idUsuario}`);
    return this.compraService.findByUsuario(idUsuario);
  }

// -------------------------------------------------------------------------------
// MÉTODOS DE ESCRITURA (POST/PUT)
// -------------------------------------------------------------------------------

  @Post()
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateCompraDto })
  @ApiOperation({ summary: 'Registrar una nueva compra (AUMENTA stock)' })
  create(@Body() createCompraDto: CreateCompraDto, @Req() req: any): Promise<CompraResponseDto> {
    const userId = req.user.id; // Asumimos que el AuthGuard adjunta el ID del usuario
    this.logger.log(`--- ENTRADA A create (POST) ---`);
    this.logger.debug(`ID de Usuario Autenticado: ${userId}`);
    this.logger.debug(`Body (DTO de Creación): ${JSON.stringify(createCompraDto)}`);
    return this.compraService.create(createCompraDto, userId);
  }

  @Put(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER)
  @ApiParam({ name: 'id', type: Number, description: 'ID de la compra a actualizar' })
  @ApiBody({ type: UpdateCompraDto })
  @ApiOperation({ summary: 'Actualizar compra existente (AJUSTA stock)' })
  update(
    @Param('id') id: number, 
    @Body() updateCompraDto: UpdateCompraDto
  ): Promise<CompraResponseDto> {
    this.logger.log(`--- ENTRADA A update (PUT) ---`);
    this.logger.debug(`Parámetro (ID Compra): ${id}`);
    this.logger.debug(`Body (DTO de Actualización): ${JSON.stringify(updateCompraDto)}`);
    return this.compraService.update(id, updateCompraDto);
  }
}