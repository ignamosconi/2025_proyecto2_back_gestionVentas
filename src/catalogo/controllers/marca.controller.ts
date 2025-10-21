// src/catalogo/controllers/marca.controller.ts

import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    HttpCode, 
    HttpStatus,
    UseGuards, 
    ParseIntPipe,
    Inject, 
    Put
} from '@nestjs/common';

// Importación de la enumeración (usando la ruta correcta en tu proyecto)
import { UserRole } from '../../users/helpers/enum.roles'; 
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

import { MarcaControllerInterface } from './interfaces/marca.controller-interface';
import { MarcaServiceInterface } from '../services/interfaces/marca.service.interface';
import { MARCA_SERVICE } from '../../constants';
import { CreateMarcaDto } from '../dto/create-marca.dto';
import { UpdateMarcaDto } from '../dto/update-marca.dto';
import { Marca } from '../entities/marca.entity';


@Controller('marcas') 
@UseGuards(AuthGuard, RolesGuard)
export class MarcaController implements MarcaControllerInterface { 
    constructor(
        @Inject(MARCA_SERVICE)
        private readonly marcaService: MarcaServiceInterface
    ) {}

    // GET /marcas (Lectura: Permitido a todos los autenticados)
    //@Roles(UserRole.OWNER, UserRole.EMPLOYEE) para restringir
    @Get() 
    findAll(): Promise<Marca[]> {
        console.log(`[MarcaController] GET /marcas - Obteniendo todas las marcas activas.`);
        return this.marcaService.findAll();
    }

    // GET /marcas/:id
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: string): Promise<Marca> {
        console.log(`[MarcaController] GET /marcas/${id} - Obteniendo marca activa por ID.`);
        return this.marcaService.findOneActive(+id);
    }

    // POST /marcas (Creación: Permitido solo a OWNER)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(UserRole.OWNER) // Usando el rol 'OWNER'
    create(@Body() createMarcaDto: CreateMarcaDto): Promise<Marca> {
        console.log(`[MarcaController] POST /marcas - Creando marca con datos:`, createMarcaDto);
        return this.marcaService.create(createMarcaDto);
    }

    // PATCH /marcas/:id (Actualización: Permitido solo a OWNER)
    @Put(':id')
    @Roles(UserRole.OWNER) // Usando el rol 'OWNER'
    update(
        @Param('id', ParseIntPipe) id: string, 
        @Body() updateMarcaDto: UpdateMarcaDto
    ): Promise<Marca> {
        console.log(`[MarcaController] PUT /marcas/${id} - Actualizando marca con datos:`, updateMarcaDto);
        return this.marcaService.update(+id, updateMarcaDto);
    }

    // DELETE /marcas/:id (Eliminación: Permitido solo a OWNER)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) 
    @Roles(UserRole.OWNER) // Usando el rol 'OWNER'
    softDelete(@Param('id', ParseIntPipe) id: string): Promise<void> {
        console.log(`[MarcaController] DELETE /marcas/${id} - Eliminando marca lógicamente.`);
        return this.marcaService.softDelete(+id);
    }

    // PATCH /marcas/:id/restore (Restauración: Permitido solo a OWNER)
    @Patch(':id/restore')
    @HttpCode(HttpStatus.OK)
    @Roles(UserRole.OWNER) // Usando el rol 'OWNER'
    restore(@Param('id', ParseIntPipe) id: string): Promise<void> {
        console.log(`[MarcaController] PATCH /marcas/${id}/restore - Restaurando marca eliminada.`);
        return this.marcaService.restore(+id);
    }
}