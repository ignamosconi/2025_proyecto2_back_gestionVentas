import { UserResponseDto } from '../dto/user-response.dto';
import { RegisterEmployeeDTO } from '../dto/register-employee.dto';
import { RegisterEmployeeOwnerDTO } from '../dto/register-employee-owner.dto';
import { UpdateUserDTO } from '../dto/update-user.dto';
import { MessageResponseDTO } from 'src/auth/dto/message-response.dto';

export interface IUsersController {
  findAll(): Promise<UserResponseDto[]>;
  findAllDeleted(): Promise<UserResponseDto[]>;
  registerPublic(body: RegisterEmployeeDTO): Promise<UserResponseDto>;
  createUserByOwner(body: RegisterEmployeeOwnerDTO): Promise<UserResponseDto>;
  update(id: number, body: UpdateUserDTO): Promise<UserResponseDto>;
  delete(id: number): Promise<MessageResponseDTO>;
  restore(id: number): Promise<MessageResponseDTO>;
}
