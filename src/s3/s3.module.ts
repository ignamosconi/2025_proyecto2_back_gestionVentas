import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IS3Service',
      useClass: S3Service,
    },
  ],
  exports: ['IS3Service'], //nos permite usar s3 en otros servicios
})
export class S3Module {}
