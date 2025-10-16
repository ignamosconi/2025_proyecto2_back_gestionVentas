import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ConfigModule } from '@nestjs/config';
import { S3Controller } from './s3.controller';

@Module({
  imports: [ConfigModule],
  controllers: [S3Controller],
  providers: [S3Service],
  exports: [S3Service], //nos permite usar s3 en otros servicios
})
export class S3Module {}