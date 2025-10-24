// src/catalogo/catalogo.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 1. Entidades
import { Marca } from './entities/marca.entity';
import { MarcaLinea } from './entities/marca-linea.entity';
import { Linea } from './entities/linea.entity';

// 2. Controladores y Servicios (Implementaciones)
import { MarcaController } from './controllers/marca.controller';
import { MarcaService } from './services/marca.service';
import { MarcaRepository } from './repositories/marca.repository';

import { LineaController } from './controllers/linea.controller';
import { LineaService } from './services/linea.service';
import { LineaRepository } from './repositories/linea.repository';

import { MarcaLineaController } from './controllers/marca-linea.controller'; // ⬅️ AÑADIDO
import { MarcaLineaService } from './services/marca-linea.service';       // ⬅️ AÑADIDO
import { MarcaLineaRepository } from './repositories/marca-linea.repository'; // ⬅️ AÑADIDO

// 3. Constantes / Tokens de Inyección
import { 
    MARCA_REPOSITORY, 
    MARCA_SERVICE, 
    LINEA_REPOSITORY, 
    LINEA_SERVICE, 
    MARCA_LINEA_REPOSITORY, // ⬅️ AÑADIDO
    MARCA_LINEA_SERVICE,    // ⬅️ AÑADIDO
    // PRODUCTOS_VALIDATOR 
} from '../constants'; 

// 4. Interfaces y Módulos de Soporte
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { ProductoModule } from 'src/producto/producto.module';
import { Producto } from 'src/producto/entities/producto.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Marca, MarcaLinea, Linea, Producto]),
        AuthModule,
        UsersModule,
        forwardRef(() => ProductoModule), // ⬅️ Usamos forwardRef para evitar dependencia circular
    ],
    controllers: [
        MarcaController,
        LineaController,
        MarcaLineaController, // ⬅️ AÑADIDO el controlador para el ruteo
    ],
    providers: [
        // --------------------------------------------------------
        // 1. Providers de MARCA
        // --------------------------------------------------------
        { provide: MARCA_SERVICE, useClass: MarcaService },
        { provide: MARCA_REPOSITORY, useClass: MarcaRepository }, 
        
        // --------------------------------------------------------
        // 2. Providers de LÍNEA
        // --------------------------------------------------------
        { provide: LINEA_SERVICE, useClass: LineaService },
        { provide: LINEA_REPOSITORY, useClass: LineaRepository },

        // --------------------------------------------------------
        // 3. Providers de MARCA-LÍNEA (Asignaciones) ⬅️ AÑADIDO
        // --------------------------------------------------------
        { provide: MARCA_LINEA_SERVICE, useClass: MarcaLineaService },
        { provide: MARCA_LINEA_REPOSITORY, useClass: MarcaLineaRepository },

        // --------------------------------------------------------
        // 4. Dependencias compartidas
        // --------------------------------------------------------
        // { provide: PRODUCTOS_VALIDATOR, useClass: MockProductosValidator }, 
    ],
    exports: [
        // Exportamos los tokens de los servicios para que otros módulos los puedan inyectar
        MARCA_SERVICE,
        LINEA_SERVICE,
        MARCA_LINEA_SERVICE, // ⬅️ Exportamos el servicio de MarcaLinea
        // Exportamos TypeOrmModule para dar acceso a las entidades a otros módulos
        TypeOrmModule, 
    ],
})
export class CatalogoModule {}