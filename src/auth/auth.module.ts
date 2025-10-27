//ARCHIVO: auth.module.ts

import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from './jwt/jwt.module';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './guards/roles.guard';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    JwtModule,
    forwardRef(() => UsersModule), // Necesario para usar UsersService en AuthService
    forwardRef(() => AuditoriaModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, JwtService, RolesGuard],
  exports: [
    AuthGuard, //Exportamos AuthGuard porque lo usamos en el resto de la app
    RolesGuard,
    JwtModule,
  ],
})
export class AuthModule {}
