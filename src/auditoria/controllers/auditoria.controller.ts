import { BadRequestException, Body, Controller, Get, Inject, ParseEnumPipe, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { IAuditoriaController } from '../interfaces/auditoria.controller.interface';
import { AuditoriaService } from '../services/auditoria.service';
import { EventosAuditoria } from '../helpers/enum.eventos';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/helpers/enum.roles';
import { AuditoriaLogDTO } from '../dto/auditoria-log.dto';
import { OptionalParseEnumPipe } from '../pipes/tipo-evento.pipe';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.OWNER) // Solo dueños pueden consultar auditoría
@Controller('auditoria')
export class AuditoriaController implements IAuditoriaController {
  constructor(
    @Inject('IAuditoriaService')
    private readonly service: AuditoriaService,
  ) {}


  @ApiOperation({ summary: 'Listar tipos de eventos disponibles' })
  @ApiResponse({ status: 200, description: 'Tipos de eventos' })
  @Get('enum')
  getEventTypes(): string[] {
    // Retornamos todos los valores del enum EventosAuditoria
    console.log("[AUDITOR] Mostrando valores de ENUM")
    return Object.values(EventosAuditoria);
  }

  @ApiOperation({ summary: 'Listar eventos de auditoría completos' })
  @ApiResponse({ status: 200, description: 'Lista de auditorías realizadas completa' })
  @Get()
  async obtenerEventos(
    @Query('userId') userId?: number,
    @Query('tipo_evento', new OptionalParseEnumPipe(EventosAuditoria, {
      exceptionFactory: () => new BadRequestException('Query(tipo_evento) inválida. Consultar /auditoria/enum '),
    })) tipo_evento?: EventosAuditoria,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<AuditoriaLogDTO[]> {
    console.log("[AUDITOR] Mostrando entradas auditadas")
    return this.service.listarEventos(
      userId,
      tipo_evento,
      fechaDesde ? new Date(fechaDesde) : undefined,
      fechaHasta ? new Date(fechaHasta) : undefined,
    );
  }
}