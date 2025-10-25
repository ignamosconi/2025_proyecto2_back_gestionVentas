import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { UserRole } from './helpers/enum.roles';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hashSync: jest.fn((password: string) => `hashed_${password}`),
}));

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: any;
  let mockMailerService: any;

  // Datos de prueba reutilizables
  const validEmployeeData = {
    email: 'employee@example.com',
    password: 'ValidPass123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+54 9 11 1234-5678',
    address: 'Calle Falsa 123',
  };

  const mockUserEntity: UserEntity = {
    id: 1,
    email: 'employee@example.com',
    password: 'hashed_ValidPass123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+54 9 11 1234-5678',
    address: 'Calle Falsa 123',
    role: UserRole.EMPLOYEE,
    deletedAt: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  };

  beforeEach(async () => {
    // Mock del repositorio
    mockUserRepository = {
      findAll: jest.fn(),
      findAllDeleted: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findByResetToken: jest.fn(),
    };

    // Mock del servicio de correo
    mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'IMailerService',
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debería retornar arreglo de respuestas de usuarios', async () => {
      const users = [mockUserEntity];
      mockUserRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        email: 'employee@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.EMPLOYEE,
      });
    });
  });

  describe('findAllDeleted', () => {
    it('debería retornar arreglo de usuarios eliminados', async () => {
      const deletedUser = { ...mockUserEntity, deletedAt: new Date() };
      mockUserRepository.findAllDeleted.mockResolvedValue([deletedUser]);

      const result = await service.findAllDeleted();

      expect(result).toHaveLength(1);
    });
  });

  describe('findByEmail', () => {
    it('debería retornar usuario cuando existe', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUserEntity);

      const result = await service.findByEmail('employee@example.com');

      expect(result).toEqual(mockUserEntity);
    });
  });

  describe('registerAsEmployee', () => {
    it('debería registrar empleado con datos válidos', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        ...mockUserEntity,
        id: 1,
      });

      const result = await service.registerAsEmployee(validEmployeeData);

      expect(result.role).toBe(UserRole.EMPLOYEE);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockMailerService.sendMail).toHaveBeenCalled();
      expect(bcrypt.hashSync).toHaveBeenCalledWith('ValidPass123!', 10);
    });

    it('debería rechazar email duplicado', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUserEntity);

      await expect(
        service.registerAsEmployee(validEmployeeData),
      ).rejects.toThrow('Ya existe un usuario con ese email');
    });

    it('debería rechazar contraseña inválida', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.registerAsEmployee({
          ...validEmployeeData,
          password: 'weak',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerByOwner', () => {
    it('debería registrar usuario como EMPLOYEE por defecto', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        ...mockUserEntity,
        role: UserRole.EMPLOYEE,
      });

      const result = await service.registerByOwner(validEmployeeData);

      expect(result.role).toBe(UserRole.EMPLOYEE);
    });

    it('debería registrar usuario con rol especificado', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        ...mockUserEntity,
        role: UserRole.OWNER,
      });

      const result = await service.registerByOwner({
        ...validEmployeeData,
        role: UserRole.OWNER,
      });

      expect(result.role).toBe(UserRole.OWNER);
    });

    it('debería rechazar email duplicado', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUserEntity);

      await expect(service.registerByOwner(validEmployeeData)).rejects.toThrow(
        'Ya existe un usuario con ese email',
      );
    });
  });

  describe('update', () => {
    it('debería actualizar datos sin cambiar contraseña', async () => {
      const updatedUser = { ...mockUserEntity, firstName: 'Jane' };
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, { firstName: 'Jane' });

      expect(result.firstName).toBe('Jane');
    });

    it('debería actualizar y hashear contraseña válida', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUserEntity);
      mockUserRepository.update.mockResolvedValue(mockUserEntity);

      await service.update(1, { password: 'NewValidPass123!' });

      expect(bcrypt.hashSync).toHaveBeenCalledWith('NewValidPass123!', 10);
    });

    it('debería rechazar actualización con usuario inexistente', async () => {
      mockUserRepository.update.mockResolvedValue(null);

      await expect(service.update(999, { firstName: 'Jane' })).rejects.toThrow(
        'No se pudo actualizar el usuario',
      );
    });
  });

  describe('softDelete', () => {
    it('debería eliminar usuario existente', async () => {
      mockUserRepository.softDelete.mockResolvedValue(true);

      const result = await service.softDelete(1);

      expect(result.message).toContain('Usuario ID N°1 eliminado');
    });

    it('debería rechazar eliminación de usuario inexistente', async () => {
      mockUserRepository.softDelete.mockResolvedValue(false);

      await expect(service.softDelete(999)).rejects.toThrow(
        'No se pudo eliminar el usuario',
      );
    });
  });

  describe('restore', () => {
    it('debería restaurar usuario eliminado', async () => {
      mockUserRepository.restore.mockResolvedValue(true);

      const result = await service.restore(1);

      expect(result.message).toContain('Usuario ID N°1 restaurado');
    });

    it('debería rechazar restauración de usuario inexistente', async () => {
      mockUserRepository.restore.mockResolvedValue(false);

      await expect(service.restore(999)).rejects.toThrow(
        'No se pudo restaurar el usuario',
      );
    });
  });

  describe('Recuperación de Contraseña', () => {
    it('debería establecer token de recuperación', async () => {
      const token = 'reset-token-123';
      const expires = new Date();
      mockUserRepository.update.mockResolvedValue(mockUserEntity);

      await service.setResetPasswordToken(1, token, expires);

      expect(mockUserRepository.update).toHaveBeenCalledWith(1, {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      });
    });

    it('debería actualizar contraseña y limpiar tokens', async () => {
      mockUserRepository.update.mockResolvedValue(mockUserEntity);

      await service.updatePassword(1, 'NewSecurePass123!');

      expect(bcrypt.hashSync).toHaveBeenCalledWith('NewSecurePass123!', 10);
      expect(mockUserRepository.update).toHaveBeenCalledWith(1, {
        password: 'hashed_NewSecurePass123!',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
    });

    it('debería enviar email de recuperación', async () => {
      const email = 'test@example.com';
      const resetLink = 'http://example.com/reset?token=abc123';

      await service.sendPasswordResetEmail(email, resetLink);

      expect(mockMailerService.sendMail).toHaveBeenCalled();
    });
  });
});
