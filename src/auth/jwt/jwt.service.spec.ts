import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserRole } from 'src/users/helpers/enum.roles';

jest.mock('jsonwebtoken');

describe('JwtService', () => {
  let service: JwtService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_ACCESS_EXPIRATION: '15m',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_REFRESH_EXPIRATION: '1d',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('debería generar token de acceso por defecto', () => {
      (jwt.sign as jest.Mock).mockReturnValue('generated-access-token');

      const result = service.generateToken({
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
      });

      expect(result).toBe('generated-access-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { email: 'test@example.com', role: UserRole.EMPLOYEE },
        'access-secret',
        { expiresIn: '15m' },
      );
    });

    it('debería generar refresh token cuando se especifica', () => {
      (jwt.sign as jest.Mock).mockReturnValue('generated-refresh-token');

      const result = service.generateToken(
        { email: 'test@example.com', role: UserRole.EMPLOYEE },
        'refresh',
      );

      expect(result).toBe('generated-refresh-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { email: 'test@example.com', role: UserRole.EMPLOYEE },
        'refresh-secret',
        { expiresIn: '1d' },
      );
    });
  });

  describe('refreshToken - Valores Límite', () => {
    it('debería retornar solo access token cuando refresh tiene >20 min', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const mockPayload = {
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
        exp: currentTime + 30 * 60, // 30 minutos restantes
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (jwt.sign as jest.Mock).mockReturnValue('new-access-token');

      const result = service.refreshToken('valid-refresh-token');

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(jwt.sign).toHaveBeenCalledTimes(1);
    });

    it('debería retornar ambos tokens cuando refresh tiene <20 min', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const mockPayload = {
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
        exp: currentTime + 10 * 60, // 10 minutos restantes
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = service.refreshToken('valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });

    it('debería rechazar token sin exp', () => {
      const mockPayload = {
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
        // sin exp
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      expect(() => service.refreshToken('invalid-token')).toThrow(
        UnauthorizedException,
      );
    });

    it('debería rechazar token inválido', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.refreshToken('invalid-token')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getPayload', () => {
    it('debería retornar payload de token válido', () => {
      const mockPayload = {
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
        exp: 123456789,
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = service.getPayload('valid-token');

      expect(result).toEqual(mockPayload);
    });

    it('debería rechazar token en formato string', () => {
      (jwt.verify as jest.Mock).mockReturnValue('invalid-string-payload');

      expect(() => service.getPayload('invalid-token')).toThrow(
        'Token inválido',
      );
    });

    it('debería rechazar token sin email', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ role: UserRole.EMPLOYEE });

      expect(() => service.getPayload('invalid-token')).toThrow(
        'Token inválido',
      );
    });
  });
});
