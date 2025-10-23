//ARCHIVO: auth.service.ts

import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO } from './dto/login.dto';
import { TokenPairDTO } from './dto/token-pair.dto';
import { compareSync } from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { IJwtService } from './interfaces/jwt.service.interface';
import { IAuthService } from './interfaces/auth.service.interface';
import { randomBytes } from 'crypto';
import { addHours, isAfter } from 'date-fns';
import { validatePasswordStrength } from '../users/helpers/validatePasswordStrength';
import { ConfigService } from '@nestjs/config';
import { IUsersService } from '../users/interfaces/users.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
    private readonly configService: ConfigService,
    @Inject('IJwtService') private readonly jwtService: IJwtService,
  ) {}

  async tokens(token: string) {
    return this.jwtService.refreshToken(token); //Obtenemos nuevos access y/o refresh del jwtService
  }

  async login(body: LoginDTO): Promise<TokenPairDTO> {
    const user = await this.usersService.findByEmail(body.email);
    if (!user)
      throw new UnauthorizedException(
        'No se pudo loguear. Correo electrónico inválido.',
      );

    //compareSync nos permite comparar el pswd plano que pasó el usuario con el hasheado de la bd.
    const compareResult = compareSync(body.password, user.password);
    if (!compareResult)
      throw new UnauthorizedException(
        'No se pudo loguear. Contraseña incorrecta.',
      );

    //Si el usuario pasó el logueo, le damos los tokens
    return {
      //En generateToken() se especifica que si no pasás nada, type = 'access' → usa config.access
      accessToken: this.jwtService.generateToken({ email: user.email, role: user.role }),
      refreshToken: this.jwtService.generateToken(
        { email: user.email, role: user.role },
        'refresh',
      ),
    };
  }



  /*
    OLVIDÉ MI CONTRASEÑA
  */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    // Generar token aleatorio
    const token = randomBytes(32).toString('hex');

    // Guardar token y fecha de expiración (1 hora)
    const expires = addHours(new Date(), 1);

    await this.usersService.setResetPasswordToken(user.id, token, expires);

    // Obtener URL del frontend desde .env
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Construir link dinámico
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.usersService.sendPasswordResetEmail(user.email, resetLink);

    return { message: 'Email para restablecer contraseña enviado.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(token);
    if (!user) throw new UnauthorizedException('Token inválido o expirado.');

    if (!user.resetPasswordExpires || isAfter(new Date(), user.resetPasswordExpires)) {
      throw new UnauthorizedException('Token expirado.');
    }

    // Validar nuevo password
    validatePasswordStrength(newPassword, user.email, user.firstName, user.lastName);

    // Cambiar contraseña y limpiar token
    await this.usersService.updatePassword(user.id, newPassword);

    return { message: 'Contraseña actualizada correctamente.' };
  }
}
