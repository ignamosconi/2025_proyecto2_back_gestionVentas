import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  NotFound,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';
import { UploadedFileDTO } from './dto/uploaded-file.dto';
import { IS3Service } from './interfaces/s3.service.interface';

@Injectable()
export class S3Service implements IS3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!bucket) {throw new Error('Falta AWS_S3_BUCKET_NAME en el .env');}
    if (!region) {throw new Error('Falta AWS_REGION en el .env');}
    if (!accessKeyId) {throw new Error('Falta AWS_ACCESS_KEY_ID en el .env');}
    if (!secretAccessKey)
      {throw new Error('Falta AWS_SECRET_ACCESS_KEY en el .env');}

    this.bucket = bucket;

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  getFileUrl(filename: string): string {
    const region = this.configService.get<string>('AWS_REGION');
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${filename}`;
  }

  async listAllFiles(): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
      });

      const response = await this.s3.send(command);

      if (!response.Contents) {return [];}

      const region = this.configService.get<string>('AWS_REGION');

      return response.Contents.map(
        (item) =>
          `https://${this.bucket}.s3.${region}.amazonaws.com/${item.Key}`,
      );
    } catch (error) {
      console.error('Error al listar archivos de S3:', error);
      throw new InternalServerErrorException(
        'No se pudieron listar los archivos',
      );
    }
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: filename,
        }),
      );
      return true;
    } catch (error) {
      if (
        error.name === 'NotFound' ||
        error.Code === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw new InternalServerErrorException(
        'Error al verificar existencia del archivo en S3',
      );
    }
  }

  /*
    FUNCIONAMIENTO UPLOAD:

    →SI SUBÍS UN ARCHIVO CON EL MISMO NOMBRE, SE PISA. 
    → PASAR EL ATRIBUTO ID para que el nombre corresponda a la idProducto, sino se genera random.

    → No enviás un POST con un JSON, envías un "Multipart form", con un campo "file", que tiene la 
    imagen. La respuesta es el nombre del archivo que se creó.
  */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    id?: number,
  ): Promise<UploadedFileDTO> {
    const extension = extname(originalName).toLowerCase();
    const allowedExtensions = ['.png', '.jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        'Formato no permitido. Solo imágenes .jpg, .jpeg, .png, .webp',
      );
    }

    if (fileBuffer.length > maxSize) {
      throw new BadRequestException(
        'El archivo excede el tamaño máximo de 10MB',
      );
    }

    const filename = id
      ? `${id}${extension}` //Si pasan el parámetro id, el archivo se llamará como la id
      : `${uuid()}${extension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: fileBuffer,
        ContentType: this.getMimeType(extension),
      });

      await this.s3.send(command);

      const url = this.getFileUrl(filename);

      return {
        filename,
        url,
      };
    } catch (error) {
      console.error('Error al subir archivo a S3:', error);
      throw new InternalServerErrorException('Error al subir archivo a S3');
    }
  }

  /*
    FUNCIONAMIENTO DELETE

    Tenés que pasar el archivo con nombre + extensión. En productos, el nombre va a ser la id,
    y aclaramos la extensión. Sólo trabajamos con jpg y png; asique pasamos "jpg" o "png". 

    Entonces en filename escribimos "5.png", o "137.jpg", etc.
  */
  async deleteFile(filename: string): Promise<void> {
    try {
      // 1. Verificar si el archivo existe con HeadObjectCommand
      // Si el objeto NO existe, este comando lanza una excepción NotFound.
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: filename,
        }),
      );

      // 2. Si la verificación fue exitosa, el archivo existe y procedemos a eliminarlo.
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      });
      await this.s3.send(command);
    } catch (error) {
      // 3. Manejo de errores

      // Si el error es NotFound del SDK de AWS (HTTP 404), significa que el archivo no existe.
      if (error instanceof NotFound) {
        console.warn(
          `Intento de eliminar archivo inexistente en S3: ${filename}`,
        );
        // Lanzamos una NotFoundException de NestJS, lo que resultará en un 404 al cliente.
        throw new NotFoundException(
          `El archivo "${filename}" no existe en S3.`,
        );
      }

      // Cualquier otro error (permisos, bucket, red, etc.)
      console.error('Error al eliminar archivo de S3:', error);
      throw new InternalServerErrorException('Error al eliminar archivo de S3');
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpg',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}
