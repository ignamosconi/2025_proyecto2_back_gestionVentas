import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../users/helpers/enum.roles';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (userRole: UserRole): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: userRole },
        }),
      }),
    } as any;
  };

  describe('canActivate - Tabla de Decisión (Roles Requeridos × Rol Usuario)', () => {
    // Caso 1: Sin roles requeridos → siempre permitir
    it('debería permitir acceso cuando no hay roles requeridos', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext(UserRole.EMPLOYEE);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    // Caso 2: Rol OWNER requerido × Usuario OWNER → permitir
    it('debería permitir acceso cuando usuario es OWNER y OWNER es requerido', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
      const context = createMockContext(UserRole.OWNER);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    // Caso 3: Rol OWNER requerido × Usuario EMPLOYEE → denegar
    it('debería denegar acceso cuando usuario es EMPLOYEE y OWNER es requerido', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
      const context = createMockContext(UserRole.EMPLOYEE);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    // Caso 4: Rol EMPLOYEE requerido × Usuario EMPLOYEE → permitir
    it('debería permitir acceso cuando usuario es EMPLOYEE y EMPLOYEE es requerido', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.EMPLOYEE]);
      const context = createMockContext(UserRole.EMPLOYEE);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    // Caso 5: Rol EMPLOYEE requerido × Usuario OWNER → denegar
    it('debería denegar acceso cuando usuario es OWNER y solo EMPLOYEE es requerido', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.EMPLOYEE]);
      const context = createMockContext(UserRole.OWNER);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    // Caso 6: Múltiples roles requeridos [OWNER, EMPLOYEE] × Usuario OWNER → permitir
    it('debería permitir acceso cuando usuario tiene uno de múltiples roles permitidos (OWNER)', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.OWNER, UserRole.EMPLOYEE]);
      const context = createMockContext(UserRole.OWNER);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    // Caso 7: Múltiples roles requeridos [OWNER, EMPLOYEE] × Usuario EMPLOYEE → permitir
    it('debería permitir acceso cuando usuario tiene uno de múltiples roles permitidos (EMPLOYEE)', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.OWNER, UserRole.EMPLOYEE]);
      const context = createMockContext(UserRole.EMPLOYEE);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
