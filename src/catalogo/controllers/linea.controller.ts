// src/catalogo/controllers/linea.controller.ts

import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Param, 
    Body, 
    HttpCode, 
    HttpStatus, 
    ParseIntPipe, 
    Inject,
    UseGuards, // ✅ Añadido
    Patch, // ✅ Para la restauración
} from '@nestjs/common';

import { Linea } from '../entities/linea.entity';
import { CreateLineaDto } from '../dto/create-linea.dto';
import { UpdateLineaDto } from '../dto/update-linea.dto';
import { LineaServiceInterface } from '../services/interfaces/linea.service-interface';
import { LINEA_SERVICE } from '../constants'; 

// ✅ Importaciones de Seguridad (Asegúrate de que estas rutas sean correctas)
import { UserRole } from '../../users/helpers/enum.roles'; 
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';


// 🛡️ Aplicamos los Guards a TODO el controlador por defecto
@UseGuards(AuthGuard, RolesGuard) 
@Controller('lineas') 
export class LineaController {
    constructor(
        @Inject(LINEA_SERVICE)
        private readonly lineaService: LineaServiceInterface,
    ) {}

// ---------------------------------------------------------------------
// MÉTODOS DE LECTURA (GET) - Solo requieren Autenticación
// ---------------------------------------------------------------------

    /**
     * GET /lineas
     * Obtiene todas las líneas activas.
     */
    @Get()
    findAll(): Promise<Linea[]> {
        return this.lineaService.findAll();
    }

    /**
     * GET /lineas/:id
     * Obtiene una línea activa por su ID.
     */
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Linea> {
        return this.lineaService.findOneActive(id);
    }

// ---------------------------------------------------------------------
// MÉTODOS DE ESCRITURA (POST, PUT, DELETE, RESTORE) - Requieren rol OWNER
// ---------------------------------------------------------------------

    /**
     * POST /lineas
     * Crea una nueva línea.
     */
    @Post()
    @Roles(UserRole.OWNER) // 🔒 Restringido a OWNER
    @HttpCode(HttpStatus.CREATED) 
    async create(@Body() data: CreateLineaDto): Promise<Linea> {
        return this.lineaService.create(data);
    }

    /**
     * PUT /lineas/:id
     * Actualiza una línea existente.
     */
    @Put(':id')
    @Roles(UserRole.OWNER) // 🔒 Restringido a OWNER
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: UpdateLineaDto,
    ): Promise<Linea> {
        return this.lineaService.update(id, data);
    }

    /**
     * DELETE /lineas/:id
     * Realiza un borrado lógico (soft-delete).
     */
    @Delete(':id')
    @Roles(UserRole.OWNER) // 🔒 Restringido a OWNER
    @HttpCode(HttpStatus.NO_CONTENT) 
    async softDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.lineaService.softDelete(id);
    }

    /**
     * PATCH /lineas/restore/:id
     * Restaura una línea eliminada suavemente.
     */
    @Patch('restore/:id')
    @Roles(UserRole.OWNER) // 🔒 Restringido a OWNER
    @HttpCode(HttpStatus.OK) // Cambié a OK (200) o NO_CONTENT (204) es aceptable
    async restore(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.lineaService.restore(id);
    }
}