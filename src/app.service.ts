import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Estamos trabajando en su sistema de gestión de ventas :)';
  }
}