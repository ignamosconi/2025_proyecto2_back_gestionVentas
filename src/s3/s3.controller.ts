import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Delete,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';
import type { Express } from 'express';

@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('test-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTestFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {throw new BadRequestException('Archivo no proporcionado');}

    return await this.s3Service.uploadFile(file.buffer, file.originalname, 5);
  }

  @Delete('test-delete')
  async deleteFile(@Body() body: { filename: string }) {
      if (!body.filename) {throw new BadRequestException('Debe proporcionar un nombre de archivo')}

      await this.s3Service.deleteFile(body.filename);

      return { message: 'Archivo eliminado correctamente', filename: body.filename };
  }
}