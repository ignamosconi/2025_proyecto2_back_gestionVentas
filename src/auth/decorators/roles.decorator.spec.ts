import { Roles, ROLES_KEY } from './roles.decorator';
import { UserRole } from '../../users/helpers/enum.roles';
import { SetMetadata } from '@nestjs/common';

// Mock SetMetadata from @nestjs/common
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn((key, value) => ({ key, value })),
}));

describe('Roles Decorator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Roles - Partición de Equivalencia', () => {
    it('debería llamar SetMetadata con un rol único', () => {
      const result = Roles(UserRole.OWNER);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, [UserRole.OWNER]);
      expect(result).toEqual({ key: ROLES_KEY, value: [UserRole.OWNER] });
    });

    it('debería llamar SetMetadata con múltiples roles', () => {
      const result = Roles(UserRole.OWNER, UserRole.EMPLOYEE);

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, [UserRole.OWNER, UserRole.EMPLOYEE]);
      expect(result).toEqual({ key: ROLES_KEY, value: [UserRole.OWNER, UserRole.EMPLOYEE] });
    });

    it('debería usar la clave correcta ROLES_KEY', () => {
      expect(ROLES_KEY).toBe('roles');
    });

    it('debería permitir array vacío de roles', () => {
      const result = Roles();

      expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, []);
      expect(result).toEqual({ key: ROLES_KEY, value: [] });
    });
  });
});
