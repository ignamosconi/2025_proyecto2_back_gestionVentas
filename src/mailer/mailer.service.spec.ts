import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailerService', () => {
  let service: MailerService;
  let mockConfigService: any;
  let mockTransporter: any;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor - Partición de Equivalencia', () => {
    it('debería crear transporter con configuración completa', () => {
      jest.clearAllMocks();

      mockConfigService = {
        get: jest.fn((key: string) => {
          const config: Record<string, string> = {
            MAIL_HOST: 'smtp.sendgrid.net',
            MAIL_PORT: '587',
            MAIL_USER: 'apikey',
            MAIL_PASS: 'test-password',
            MAIL_SECURE: 'false',
          };
          return config[key];
        }),
      };

      service = new MailerService(mockConfigService);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: 'test-password',
        },
      });
    });

    it('debería NO crear transporter con configuración incompleta', () => {
      jest.clearAllMocks();

      mockConfigService = {
        get: jest.fn(() => undefined),
      };

      service = new MailerService(mockConfigService);

      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe('sendMail - Partición de Equivalencia', () => {
    beforeEach(async () => {
      mockConfigService = {
        get: jest.fn((key: string) => {
          const config: Record<string, string> = {
            MAIL_HOST: 'smtp.sendgrid.net',
            MAIL_PORT: '587',
            MAIL_USER: 'apikey',
            MAIL_PASS: 'test-password',
            MAIL_SECURE: 'false',
            MAIL_FROM: 'noreply@example.com',
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailerService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<MailerService>(MailerService);
    });

    it('debería enviar email exitosamente', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendMail(
        'test@example.com',
        'Test Subject',
        '<h1>Test</h1>',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Programación Avanzada" <noreply@example.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      });
    });

    it('debería manejar error al enviar email', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      // No debería lanzar error, solo loguear
      await expect(
        service.sendMail('test@example.com', 'Test', '<p>Test</p>'),
      ).resolves.not.toThrow();
    });
  });

  describe('sendMail sin transporter configurado', () => {
    it('debería retornar sin enviar cuando transporter es null', async () => {
      mockConfigService = {
        get: jest.fn(() => undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailerService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<MailerService>(MailerService);

      await service.sendMail('test@example.com', 'Test', '<p>Test</p>');

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
  });
});
