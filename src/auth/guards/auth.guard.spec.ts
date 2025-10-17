import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/helpers/enum.roles';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockJwtService: any;
  let mockUsersService: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.EMPLOYEE,
  };

  const mockPayload = {
    email: 'test@example.com',
    role: UserRole.EMPLOYEE,
  };

  beforeEach(async () => {
    mockJwtService = {
      getPayload: jest.fn(),
    };

    mockUsersService = {
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: 'IJwtService', useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: authHeader,
          },
          user: undefined,
        }),
      }),
    } as any;
  };

  describe('canActivate - Partición de Equivalencia', () => {
    it('debería permitir acceso con token válido', async () => {
      const context = createMockContext('Bearer valid-token');
      mockJwtService.getPayload.mockReturnValue(mockPayload);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockJwtService.getPayload).toHaveBeenCalledWith('valid-token');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('debería rechazar cuando no hay header de autorización', async () => {
      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        'No se envió el Header junto a la solicitud',
      );
    });

    it('debería rechazar formato incorrecto sin Bearer', async () => {
      const context = createMockContext('InvalidFormat token123');

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Formato de Header inválido',
      );
    });

    it('debería rechazar cuando falta el token', async () => {
      const context = createMockContext('Bearer ');

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Formato de Header inválido',
      );
    });

    it('debería rechazar cuando el usuario no existe', async () => {
      const context = createMockContext('Bearer valid-token');
      mockJwtService.getPayload.mockReturnValue(mockPayload);
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Usuario no encontrado',
      );
    });

    it('debería rechazar token inválido', async () => {
      const context = createMockContext('Bearer invalid-token');
      mockJwtService.getPayload.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Casos de Borde', () => {
    it('debería rechazar Bearer sin espacio', async () => {
      const context = createMockContext('Bearertoken123');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
