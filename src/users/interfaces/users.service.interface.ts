import { RegisterEmployeeDTO } from '../dto/register-employee.dto';
import { RegisterEmployeeOwnerDTO } from '../dto/register-employee-owner.dto';
import { UpdateUserDTO } from '../dto/update-user.dto';
import { MessageResponseDTO } from '../../auth/dto/message-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserEntity } from '../entities/user.entity';

export interface IUsersService {
  findAll(): Promise<UserResponseDto[]>;
  findAllDeleted(): Promise<UserResponseDto[]>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAllOwners(): Promise<UserEntity[]>;
  findAllEmployees(): Promise<UserEntity[]>;

  registerAsEmployee(body: RegisterEmployeeDTO): Promise<UserResponseDto>;
  registerByOwner(body: RegisterEmployeeOwnerDTO): Promise<UserResponseDto>;
  update(id: number, body: UpdateUserDTO): Promise<UserResponseDto>;
  softDelete(id: number): Promise<MessageResponseDTO>;
  restore(id: number): Promise<MessageResponseDTO>;

  setResetPasswordToken(
    userId: number,
    token: string,
    expires: Date,
  ): Promise<void>;
  sendPasswordResetEmail(email: string, resetLink: string): Promise<void>;
  findByResetToken(token: string): Promise<UserEntity | null>;
  updatePassword(userId: number, newPassword: string): Promise<void>;
}
