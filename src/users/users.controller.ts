//ARCHIVO: users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RegisterEmployeeOwnerDTO } from './dto/register-employee-owner.dto';
import { RegisterEmployeeDTO } from './dto/register-employee.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateUserDTO } from './dto/update-user.dto';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './helpers/enum.roles';
import { Roles } from '../auth/decorators/roles.decorator';
import type { IUsersController } from './interfaces/users.controller.interface';
import type { IUsersService } from './interfaces/users.service.interface';

/*
  PROTECCIÓN DE ENDPOINTS:
  @Role(UserRole.OWNER, UserRole.EMPLOYEE)
  
  Si no se pone @Role(), se asume que el endpoint solo se puede hacer por EMPLOYEE. 
*/

@Controller('users')
export class UsersController implements IUsersController {
  constructor(
    @Inject('IUsersService') private readonly service: IUsersService,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos los usuarios' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Get()
  findAll(): Promise<UserResponseDto[]> {
    console.log(
      `[UsersController] GET /users - Obteniendo todos los usuarios activos.`,
    );
    return this.service.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista de usuarios soft-deleted' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Get('/deleted')
  findAllDeleted(): Promise<UserResponseDto[]> {
    console.log(
      `[UsersController] GET /users/deleted - Obteniendo usuarios eliminados lógicamente.`,
    );
    return this.service.findAllDeleted();
  }

  //REGISTER "PÚBLICO", sólo crea usuarios con rol EMPLOYEE.
  @ApiOperation({ summary: 'Registro público de usuario EMPLOYEE' })
  @Post('register')
  registerPublic(@Body() body: RegisterEmployeeDTO): Promise<UserResponseDto> {
    console.log(
      `[UsersController] POST /users/register - Registrando EMPLOYEE: ${body.email}`,
    );
    return this.service.registerAsEmployee(body);
  }

  //REGISTER "PRIVADO", OWNER puede crear OWNER o EMPLOYEE.
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'OWNER crea un usuario (puede ser EMPLOYEE u OWNER)',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Post('register-owner')
  createUserByOwner(
    @Body() body: RegisterEmployeeOwnerDTO,
  ): Promise<UserResponseDto> {
    console.log(
      `[UsersController] POST /users/register-owner - OWNER creando usuario ${body.email} con rol ${body.role}`,
    );
    return this.service.registerByOwner(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza un usuario' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Post('/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDTO,
  ): Promise<UserResponseDto> {
    console.log(
      `[UsersController] POST /users/${id} - Actualizando usuario con datos:`,
      body,
    );
    return this.service.update(id, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimina un usuario' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number): Promise<MessageResponseDTO> {
    console.log(
      `[UsersController] DELETE /users/${id} - Eliminando (soft-delete) al usuario.`,
    );
    return this.service.softDelete(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restaura un usuario soft-deleted' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Patch('/:id/restore')
  restore(@Param('id', ParseIntPipe) id: number): Promise<MessageResponseDTO> {
    console.log(
      `[UsersController] PATCH /users/${id}/restore - Restaurando usuario eliminado.`,
    );
    return this.service.restore(id);
  }
}
