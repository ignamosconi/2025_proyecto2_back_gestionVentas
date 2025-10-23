//ARCHIVO: users.module.ts

import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserRepository } from './repositories/users.repository';
import { JwtModule } from '../auth/jwt/jwt.module';
import { AuthModule } from 'src/auth/auth.module';
import { MailerModule } from 'src/mailer/mailer.module';
<<<<<<< HEAD
import { USUARIO_REPOSITORY } from 'src/constants';
=======
import { AuditoriaModule } from 'src/auditoria/auditoria.module';
>>>>>>> 8b25e988cc6ecdcd3917d8dff1250fb8218f1182

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule, //Usado para AuthGuard
    forwardRef(() => AuthModule),
    MailerModule,
    AuditoriaModule,
  ],
  providers: [
    {
      provide: 'IUsersService',
      useClass: UsersService,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],

  exports: ['IUsersService', 'IUserRepository', USUARIO_REPOSITORY, TypeOrmModule],
  controllers: [UsersController],
})
export class UsersModule {}
