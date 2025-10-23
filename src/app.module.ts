import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { S3Module } from './s3/s3.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { ProductoModule } from './producto/producto.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { VentaModule } from './venta/venta.module';

@Module({
  imports: [
    // Cargamos el .env
    ConfigModule.forRoot({
      isGlobal: true
    }),

    // Configuramos la conexión con TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'), 
        autoLoadEntities: true,
        synchronize: false
      }),
    }),
    CatalogoModule,
    UsersModule,
    AuthModule,
    S3Module,
    ProveedorModule,
    ProductoModule,
    AuditoriaModule,
    VentaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}