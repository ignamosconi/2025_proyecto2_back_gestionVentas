import { 
    Controller, 
    Post, 
    Delete, 
    Param, 
    HttpCode, 
    HttpStatus, 
    ParseIntPipe, 
    Inject, 
    UseGuards,
    Get,
} from '@nestjs/common';

import { MarcaLinea } from '../entities/marca-linea.entity';
import { MarcaLineaServiceInterface } from '../services/interfaces/marca-linea.service.interface';
import { MARCA_LINEA_SERVICE } from '../constants';
import { CreateMarcaLineaDto } from '../dto/create-marca-linea.dto';
import { UserRole } from '../../users/helpers/enum.roles'; 
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBearerAuth,
    ApiParam
} from '@nestjs/swagger';


//  Aplicamos seguridad: Solo usuarios autenticados y con rol OWNER para escribir
@UseGuards(AuthGuard, RolesGuard)
@ApiTags('Marca-Linea Asignaciones') // Etiqueta para agrupar en Swagger
@ApiBearerAuth('access-token') 
@Controller('marca/:marcaId/linea') // Ruta enfocada en la Marca
export class MarcaLineaController {
    constructor(
        @Inject(MARCA_LINEA_SERVICE)
        private readonly marcaLineaService: MarcaLineaServiceInterface,
    ) {}


    @Get()
    @ApiOperation({ summary: 'Obtiene todas las líneas asignadas a una Marca específica.' })
    @ApiParam({ name: 'marcaId', description: 'ID de la Marca cuyas asignaciones se desean listar.' })
    @ApiResponse({ status: 200, description: 'Listado de vínculos Marca-Línea.', type: [MarcaLinea] })
    @ApiResponse({ status: 404, description: 'Marca no encontrada.' })
    async findAllByMarca(
        @Param('marcaId', ParseIntPipe) marcaId: number,
    ): Promise<MarcaLinea[]> {
        return this.marcaLineaService.findAllByMarcaId(marcaId);
    }
    
    // ---------------------------------------------------------------------
    // POST (ASIGNAR)
    // ---------------------------------------------------------------------

    /**
     * POST /marcas/:marcaId/lineas/:lineaId
     * Asigna una línea (lineaId) a una marca (marcaId).
     */
    @Post(':lineaId')
    @Roles(UserRole.OWNER) // Solo el OWNER puede gestionar vínculos
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Asigna una línea a una marca.' })
    @ApiParam({ name: 'marcaId', description: 'ID de la Marca.', type: Number })
    @ApiParam({ name: 'lineaId', description: 'ID de la Línea a asignar.', type: Number })
    @ApiResponse({ status: 201, description: 'Vínculo creado exitosamente.', type: MarcaLinea })
    @ApiResponse({ status: 409, description: 'El vínculo ya existe (Violación de PK).' })
    async assignLinea(
        @Param('marcaId', ParseIntPipe) marcaId: number,
        @Param('lineaId', ParseIntPipe) lineaId: number,
    ): Promise<MarcaLinea> {
        // Creamos el DTO con los IDs de la URL
        const data: CreateMarcaLineaDto = { marcaId, lineaId };
        return this.marcaLineaService.assignLineaToMarca(data);
    }

    // ---------------------------------------------------------------------
    // DELETE (DESASIGNAR)
    // ---------------------------------------------------------------------

    /**
     * DELETE /marcas/:marcaId/lineas/:lineaId
     * Desasigna una línea de una marca.
     */
    @Delete(':lineaId')
    @Roles(UserRole.OWNER) // Solo el OWNER puede gestionar vínculos
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Desasigna una línea de una marca.' })
    @ApiParam({ name: 'marcaId', description: 'ID de la Marca.' })
    @ApiParam({ name: 'lineaId', description: 'ID de la Línea a desasignar.' })
    @ApiResponse({ status: 204, description: 'Vínculo eliminado exitosamente.' })
    @ApiResponse({ status: 404, description: 'El vínculo no fue encontrado.' })
    async unassignLinea(
        @Param('marcaId', ParseIntPipe) marcaId: number,
        @Param('lineaId', ParseIntPipe) lineaId: number,
    ): Promise<void> {
        return this.marcaLineaService.unassignLineaFromMarca(marcaId, lineaId);
    }
}