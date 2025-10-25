// ARCHIVO: mailer.module.ts
import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IMailerService',
      useClass: MailerService,
    },
  ],
  exports: ['IMailerService'], // exportamos la interfaz, no el service
})
export class MailerModule {}
