// src/productos/producto.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// --- Entidades ---
import { Producto } from './entities/producto.entity';

// --- Componentes Propios ---
import { ProductoController } from './controllers/producto.controller';
import { ProductoService } from './services/producto.service';
import { ProductoRepository } from './repositories/producto.repository';

// --- Tokens y Dependencias ---
import { PRODUCTO_REPOSITORY, PRODUCTO_SERVICE } from '../constants'; 
import { CatalogoModule } from '../catalogo/catalogo.module'; // Provee Marca, Línea, MarcaLinea Services
import { AuthModule } from '../auth/auth.module'; // Provee Guards
import { UsersModule } from '../users/users.module'; // Provee roles/UserRole
import { UsersService } from 'src/users/users.service';
import { MailerService } from '@nestjs-modules/mailer';
import { MailerModule } from 'src/mailer/mailer.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
    imports: [
        // 1. Registro de la entidad de Producto para TypeORM
        TypeOrmModule.forFeature([Producto]),
        
        // 2. Módulos de Dependencia
        CatalogoModule, // Necesario para la lógica M:M (Marca/Línea)
        AuthModule,     // Necesario para AuthGuard y RolesGuard
        UsersModule,    // Necesario para los Roles
        MailerModule,   // Usado para envío de correos a owners cuando hay bajo stock
        S3Module,       //Usado para subir imágenes de productos
    ],
    controllers: [
        ProductoController
    ],
    providers: [
        // --- 1. Repositorio ---
        {
            provide: PRODUCTO_REPOSITORY,
            useClass: ProductoRepository,
        },
        
        // --- 2. Servicio ---
        {
            provide: PRODUCTO_SERVICE,
            useClass: ProductoService,
        },
    ],
    // Exportamos el servicio y su token por si otros módulos necesitan inyectar el ProductoService
    exports: [
        PRODUCTO_SERVICE,
        PRODUCTO_REPOSITORY
    ]
})
export class ProductoModule {}