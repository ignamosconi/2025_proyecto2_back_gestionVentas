//ARCHIVO: users.service.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterEmployeeDTO } from './dto/register-employee.dto';
import { RegisterEmployeeOwnerDTO } from './dto/register-employee-owner.dto';

import { UserEntity } from './entities/user.entity';
import { hashSync} from 'bcrypt';
import type { IUserRepository } from './interfaces/users.repository.interface';
import { UpdateUserDTO } from './dto/update-user.dto';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { validatePasswordStrength } from './helpers/validatePasswordStrength';
import { UserRole } from './helpers/enum.roles';
import { IUsersService } from './interfaces/users.service.interface';


@Injectable()
export class UsersService implements IUsersService{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) { }

  private toUserResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }


  async findAll(): Promise<UserResponseDto[]> {
    const users =  await this.userRepository.findAll()
    return users.map(this.toUserResponse)
  }

  async findAllDeleted(): Promise<UserResponseDto[]> {
    const deletedUsers = await this.userRepository.findAllDeleted();
    return deletedUsers.map(this.toUserResponse);
  }

  //Usado por auth.service en login()
  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findByEmail(email);
  }


  // Registro público (solo EMPLOYEE)
async registerAsEmployee(body: RegisterEmployeeDTO): Promise<UserResponseDto> {
  validatePasswordStrength(body.password, body.email, body.firstName, body.lastName);

  if (await this.userRepository.findByEmail(body.email)) {
    throw new BadRequestException('Ya existe un usuario con ese email');
  }

  const user = new UserEntity();
  Object.assign(user, body);
  user.password = hashSync(user.password, 10);
  user.role = UserRole.EMPLOYEE; // 🔒 Forzamos EMPLOYEE

  const savedUser = await this.userRepository.save(user);
  return this.toUserResponse(savedUser);
}

// Registro por OWNER (puede ser OWNER o EMPLOYEE)
async registerByOwner(body: RegisterEmployeeOwnerDTO): Promise<UserResponseDto> {
  validatePasswordStrength(body.password, body.email, body.firstName, body.lastName);

  if (await this.userRepository.findByEmail(body.email)) {
    throw new BadRequestException('Ya existe un usuario con ese email');
  }

  const user = new UserEntity();
  Object.assign(user, body);
  user.password = hashSync(user.password, 10);
  user.role = body.role ?? UserRole.EMPLOYEE; // si no lo pasa, es EMPLOYEE

  const savedUser = await this.userRepository.save(user);
  return this.toUserResponse(savedUser);
}

  async update(id: number, body: UpdateUserDTO): Promise<UserResponseDto> {
    //Todos los atributos son opcionales al actualizar. 
    // Si uno de estos atributos es una contraseña nueva, vamos a:
    if (body.password) {
      
      // Traer el usuario para tener sus datos personales
      const user = await this.userRepository.findById(id);
      if (!user) throw new NotFoundException('Usuario no encontrado');
      
      // Validar la nueva contraseña con datos actuales
      validatePasswordStrength(body.password, user.email, user.firstName, user.lastName)

      //Si la contraseña es segura, la hasheamos.
      body.password = hashSync(body.password, 10);
    }

    const actualizado = await this.userRepository.update(id, body)

    if (!actualizado) throw new NotFoundException('No se pudo actualizar el usuario. Verifica que la ID exista.')
    return this.toUserResponse(actualizado)  
  }

  async softDelete(id: number): Promise<MessageResponseDTO> {
    const result = await this.userRepository.softDelete(id)
    if (!result) throw new NotFoundException('No se pudo eliminar el usuario. Verifica que la ID exista.');
    
    return { message: 'Usuario ID N°' + id + ' eliminado.'  }
  }

  async restore(id: number): Promise<MessageResponseDTO> {
    const result = await this.userRepository.restore(id);
    if (!result) throw new NotFoundException('No se pudo restaurar el usuario. Verifica que la ID exista.');

    return { message: `Usuario ID N°${id} restaurado correctamente.` };
  }
}
