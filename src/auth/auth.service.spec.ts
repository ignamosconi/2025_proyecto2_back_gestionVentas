import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/helpers/enum.roles';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;
  let mockConfigService: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.EMPLOYEE,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      setResetPasswordToken: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      findByResetToken: jest.fn(),
      updatePassword: jest.fn(),
    };

    mockJwtService = {
      generateToken: jest.fn(),
      refreshToken: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'IUsersService', useValue: mockUsersService },
        { provide: 'IJwtService', useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login - Partición de Equivalencia', () => {
    it('debería retornar tokens con credenciales válidas', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      mockJwtService.generateToken
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'ValidPass123!',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('debería rechazar email inexistente', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'ValidPass123!',
        }),
      ).rejects.toThrow('No se pudo loguear. Correo electrónico inválido');
    });

    it('debería rechazar contraseña incorrecta', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow('No se pudo loguear. Contraseña incorrecta');
    });
  });

  describe('tokens', () => {
    it('debería delegar al jwtService', async () => {
      mockJwtService.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
      });

      const result = await service.tokens('valid-refresh-token');

      expect(result).toEqual({ accessToken: 'new-access-token' });
    });
  });

  describe('forgotPassword', () => {
    it('debería generar token y enviar email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('Email para restablecer contraseña');
      expect(mockUsersService.setResetPasswordToken).toHaveBeenCalled();
      expect(mockUsersService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('debería rechazar usuario inexistente', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword - Valores Límite', () => {
    it('debería actualizar contraseña con token válido y no expirado', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const userWithValidToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: futureDate,
      };

      mockUsersService.findByResetToken.mockResolvedValue(userWithValidToken);
      mockUsersService.updatePassword.mockResolvedValue(undefined);

      const result = await service.resetPassword(
        'valid-token',
        'NewValidPass123!',
      );

      expect(result.message).toBe('Contraseña actualizada correctamente.');
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        1,
        'NewValidPass123!',
      );
    });

    it('debería rechazar token inexistente', async () => {
      mockUsersService.findByResetToken.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'NewValidPass123!'),
      ).rejects.toThrow('Token inválido o expirado');
    });

    it('debería rechazar token expirado', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      const userWithExpiredToken = {
        ...mockUser,
        resetPasswordToken: 'expired-token',
        resetPasswordExpires: pastDate,
      };

      mockUsersService.findByResetToken.mockResolvedValue(
        userWithExpiredToken,
      );

      await expect(
        service.resetPassword('expired-token', 'NewValidPass123!'),
      ).rejects.toThrow('Token expirado');
    });

    it('debería rechazar cuando resetPasswordExpires es null', async () => {
      const userWithNullExpires = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: null,
      };

      mockUsersService.findByResetToken.mockResolvedValue(
        userWithNullExpires,
      );

      await expect(
        service.resetPassword('valid-token', 'NewValidPass123!'),
      ).rejects.toThrow('Token expirado');
    });
  });
});
