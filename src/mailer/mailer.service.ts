import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { IMailerService } from './interfaces/mailer.service.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService implements IMailerService {
  private transporter: Transporter | null = null;
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT'));
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const secure = this.configService.get<string>('MAIL_SECURE') === 'true';

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('Mailer deshabilitado: configuración incompleta.');
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email no enviado a ${to}: Mailer no configurado.`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Programación Avanzada" <${this.configService.get('MAIL_FROM')}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email enviado: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `Error al enviar el email: ${error.message}`,
        error.stack,
      );
    }
  }
}
