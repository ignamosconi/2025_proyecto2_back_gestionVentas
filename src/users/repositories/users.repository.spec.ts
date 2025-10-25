import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from './users.repository';
import { UserEntity } from '../entities/user.entity';
import { UserRole } from '../helpers/enum.roles';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<UserEntity>>;

  const mockUser: UserEntity = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
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
    mockTypeOrmRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('debería retornar usuario cuando existe', async () => {
      mockTypeOrmRepo.findOneBy.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('debería retornar null cuando no existe', async () => {
      mockTypeOrmRepo.findOneBy.mockResolvedValue(null);

      const result = await userRepository.findByEmail(
        'nonexistent@example.com',
      );

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('debería retornar usuario cuando existe', async () => {
      mockTypeOrmRepo.findOneBy.mockResolvedValue(mockUser);

      const result = await userRepository.findById(1);

      expect(result).toEqual(mockUser);
    });

    it('debería retornar null cuando no existe', async () => {
      mockTypeOrmRepo.findOneBy.mockResolvedValue(null);

      const result = await userRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('debería guardar y retornar usuario', async () => {
      mockTypeOrmRepo.save.mockResolvedValue(mockUser);

      const result = await userRepository.save(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('debería actualizar y retornar usuario', async () => {
      const updatedUser = { ...mockUser, firstName: 'Jane' };
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeOrmRepo.findOneBy.mockResolvedValue(updatedUser);

      const result = await userRepository.update(1, { firstName: 'Jane' });

      expect(result).toEqual(updatedUser);
    });
  });

  describe('softDelete - Valores Límite', () => {
    it('debería retornar true cuando affected = 1', async () => {
      mockTypeOrmRepo.softDelete.mockResolvedValue({ affected: 1 } as any);

      const result = await userRepository.softDelete(1);

      expect(result).toBe(true);
    });

    it('debería retornar false cuando affected = 0', async () => {
      mockTypeOrmRepo.softDelete.mockResolvedValue({ affected: 0 } as any);

      const result = await userRepository.softDelete(999);

      expect(result).toBe(false);
    });
  });

  describe('restore - Valores Límite', () => {
    it('debería retornar true cuando affected = 1', async () => {
      mockTypeOrmRepo.restore.mockResolvedValue({ affected: 1 } as any);

      const result = await userRepository.restore(1);

      expect(result).toBe(true);
    });

    it('debería retornar false cuando affected = 0', async () => {
      mockTypeOrmRepo.restore.mockResolvedValue({ affected: 0 } as any);

      const result = await userRepository.restore(999);

      expect(result).toBe(false);
    });
  });
});
