//ARCHIVO: users.module.ts

import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserRepository } from './repositories/users.repository';
import { JwtModule } from '../auth/jwt/jwt.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule, //Usado para AuthGuard
    forwardRef(() => AuthModule),
  ],
  providers: [
    UsersService,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],

  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
