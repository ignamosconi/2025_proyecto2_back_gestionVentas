// ARCHIVO: creador-usuario-owner.ts

/*
    Este archivo nos permite generar un usuario owner, sino apenas inicia el sistema es imposible
    tenerlo. Este script se añadió al package.json.

    Este script se ejecuta con:
        npm run seed:owner
*/
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { RegisterEmployeeOwnerDTO } from '../users/dto/register-employee-owner.dto';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/helpers/enum.roles';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UsersService);
  const configService = app.get(ConfigService);

  const email = configService.get<string>('SEED_OWNER_EMAIL');
  const password = configService.get<string>('SEED_OWNER_PASSWORD');
  const firstName = configService.get<string>('SEED_OWNER_FIRST_NAME');
  const lastName = configService.get<string>('SEED_OWNER_LAST_NAME');
  const phone = configService.get<string>('SEED_OWNER_PHONE');
  const address = configService.get<string>('SEED_OWNER_ADDRESS');

  if (!email || !password || !firstName || !lastName || !phone || !address) {
    throw new Error(
      'Faltan variables de entorno necesarias para crear el usuario OWNER',
    );
  }
  const ownerDto: RegisterEmployeeOwnerDTO = {
    email,
    password,
    firstName,
    lastName,
    phone,
    address,
    role: UserRole.OWNER,
  };

  const created = await userService.registerByOwner(ownerDto);
  console.log('Usuario OWNER creado:', created);

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Error al crear el usuario OWNER', err);
});
