import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [S3Service],
  exports: [S3Service], //nos permite usar s3 en otros servicios
})
export class S3Module {}