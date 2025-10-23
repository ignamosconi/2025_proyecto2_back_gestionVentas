import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { S3Service } from './s3.service';
import { S3Client, NotFound } from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client: jest.Mocked<S3Client>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Mock ConfigService
    mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          AWS_S3_BUCKET_NAME: 'test-bucket',
          AWS_REGION: 'us-east-1',
          AWS_ACCESS_KEY_ID: 'test-key',
          AWS_SECRET_ACCESS_KEY: 'test-secret',
        };
        return config[key];
      }),
    } as any;

    // Mock S3Client
    mockS3Client = {
      send: jest.fn() as any,
    } as any;

    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
      () => mockS3Client,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor - Validación de Configuración', () => {
    it('debería lanzar error si falta AWS_S3_BUCKET_NAME', () => {
      mockConfigService.get.mockReturnValue(undefined);
      expect(() => new S3Service(mockConfigService)).toThrow(
        'Falta AWS_S3_BUCKET_NAME en el .env',
      );
    });
  });

  describe('getFileUrl', () => {
    it('debería retornar URL con formato correcto', () => {
      const url = service.getFileUrl('test.jpg');
      expect(url).toBe(
        'https://test-bucket.s3.us-east-1.amazonaws.com/test.jpg',
      );
    });
  });

  describe('uploadFile - Partición de Equivalencia y Valores Límite', () => {
    // CASO 1: Extensión inválida (partición inválida)
    it('debería rechazar extensión de archivo inválida', async () => {
      const buffer = Buffer.from('test');
      await expect(service.uploadFile(buffer, 'test.gif', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    // CASO 2: Archivo excede tamaño máximo (partición inválida - límite superior)
    it('debería rechazar archivo que excede 10MB', async () => {
      const buffer = Buffer.alloc(10 * 1024 * 1024 + 1); // 10MB + 1 byte
      await expect(service.uploadFile(buffer, 'test.png', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    // CASO 3: Archivo válido con ID (partición válida - extensión .png)
    it('debería subir archivo PNG válido con ID', async () => {
      const buffer = Buffer.from('test-image');
      (mockS3Client.send as any).mockResolvedValue({});

      const result = await service.uploadFile(buffer, 'image.png', 123);

      expect(result.filename).toBe('123.png');
      expect(result.url).toContain('123.png');
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    // CASO 4: Archivo válido sin ID (partición válida - extensión .jpg, sin ID)
    it('debería subir archivo JPG válido sin ID (genera UUID)', async () => {
      const buffer = Buffer.from('test-image');
      (mockS3Client.send as any).mockResolvedValue({});

      const result = await service.uploadFile(buffer, 'photo.jpg');

      expect(result.filename).toMatch(/^[0-9a-f-]{36}\.jpg$/); // formato UUID
      expect(result.url).toContain('.jpg');
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    // CASO 5: Error en S3 durante upload
    it('debería lanzar InternalServerErrorException cuando falla S3', async () => {
      const buffer = Buffer.from('test');
      (mockS3Client.send as any).mockRejectedValue(new Error('S3 Error'));

      await expect(service.uploadFile(buffer, 'test.png', 1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteFile - Transición de Estados', () => {
    // CASO 6: Archivo existe → se elimina exitosamente (transición válida)
    it('debería eliminar archivo existente exitosamente', async () => {
      (mockS3Client.send as any)
        .mockResolvedValueOnce({}) // HeadObjectCommand - archivo existe
        .mockResolvedValueOnce({}); // DeleteObjectCommand - eliminación exitosa

      await expect(service.deleteFile('test.png')).resolves.not.toThrow();
      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
    });

    // CASO 7: Archivo no existe → NotFoundException (transición inválida)
    it('debería lanzar NotFoundException cuando archivo no existe', async () => {
      // Crear una instancia de NotFound del SDK de AWS
      const notFoundError = new NotFound({
        $metadata: {},
        message: 'Not Found',
      });
      (mockS3Client.send as any).mockRejectedValue(notFoundError);

      await expect(service.deleteFile('inexistente.png')).rejects.toThrow(
        NotFoundException,
      );
    });

    // CASO 8: Error genérico en S3
    it('debería lanzar InternalServerErrorException en error de S3', async () => {
      (mockS3Client.send as any).mockRejectedValue(new Error('S3 Connection Error'));

      await expect(service.deleteFile('test.png')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('fileExists', () => {
    // CASO 9: Archivo existe
    it('debería retornar true cuando archivo existe', async () => {
      (mockS3Client.send as any).mockResolvedValue({});

      const exists = await service.fileExists('test.png');
      expect(exists).toBe(true);
    });

    // CASO 10: Archivo no existe (código 404)
    it('debería retornar false cuando archivo no existe', async () => {
      const notFoundError: any = {
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 },
      };
      (mockS3Client.send as any).mockRejectedValue(notFoundError);

      const exists = await service.fileExists('inexistente.png');
      expect(exists).toBe(false);
    });

    // CASO 11: Error genérico en verificación
    it('debería lanzar InternalServerErrorException en otros errores', async () => {
      (mockS3Client.send as any).mockRejectedValue(new Error('Network error'));

      await expect(service.fileExists('test.png')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('listAllFiles', () => {
    // CASO 12: Bucket con archivos
    it('debería retornar URLs de todos los archivos en el bucket', async () => {
      (mockS3Client.send as any).mockResolvedValue({
        Contents: [{ Key: 'file1.png' }, { Key: 'file2.jpg' }],
      });

      const files = await service.listAllFiles();

      expect(files).toHaveLength(2);
      expect(files[0]).toContain('file1.png');
      expect(files[1]).toContain('file2.jpg');
    });

    // CASO 13: Bucket vacío
    it('debería retornar array vacío cuando bucket está vacío', async () => {
      (mockS3Client.send as any).mockResolvedValue({ Contents: undefined });

      const files = await service.listAllFiles();
      expect(files).toEqual([]);
    });

    // CASO 14: Error al listar archivos
    it('debería lanzar InternalServerErrorException al fallar listado', async () => {
      (mockS3Client.send as any).mockRejectedValue(new Error('List error'));

      await expect(service.listAllFiles()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
