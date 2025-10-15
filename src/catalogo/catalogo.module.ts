// src/catalogo/catalogo.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 1. Entidades
import { Marca } from './entities/marca.entity';
import { MarcaLinea } from './entities/marca-linea.entity';
import { Linea } from './entities/linea.entity'; // ✅ Añadida

// 2. Controladores y Servicios (Implementaciones)
import { MarcaController } from './controllers/marca.controller';
import { MarcaService } from './services/marca.service';
import { MarcaRepository } from './repositories/marca.repository';

import { LineaController } from './controllers/linea.controller'; // ✅ Añadido
import { LineaService } from './services/linea.service'; // ✅ Añadido
import { LineaRepository } from './repositories/linea.repository'; // ✅ Añadido

// 3. Constantes / Tokens de Inyección
import { 
    MARCA_REPOSITORY, 
    MARCA_SERVICE, 
    LINEA_REPOSITORY, // ✅ Añadido
    LINEA_SERVICE, // ✅ Añadido
    //PRODUCTOS_VALIDATOR // ✅ Añadido para el softDelete de Marca
} from './constants'; 

// 4. Interfaces y Módulos de Soporte
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

// ----------------------------------------------------
// MOCK TEMPORAL para la validación de productos en MarcaService
// Este se reemplazará por la implementación real en ProductosModule
class MockProductosValidator {
    checkIfMarcaHasProducts(idMarca: number): Promise<boolean> {
        // En producción: SELECT COUNT(*) FROM productos WHERE idMarca = :idMarca
        return Promise.resolve(false); 
    }
}
// ----------------------------------------------------


@Module({
  imports: [
    // Registrar las entidades que TypeORM gestionará dentro de este módulo
    TypeOrmModule.forFeature([Marca, MarcaLinea, Linea]),
    AuthModule,
    UsersModule
  ],
  controllers: [
    MarcaController,
    LineaController, // ✅ Añadido
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
    { provide: LINEA_SERVICE, useClass: LineaService }, // ✅ Añadido
    { provide: LINEA_REPOSITORY, useClass: LineaRepository }, // ✅ Añadido

    // --------------------------------------------------------
    // 3. Dependencias compartidas (Validators, etc.)
    // --------------------------------------------------------
    // ✅ Añadido el Mock para el validador de productos (temporal)
    //{ provide: PRODUCTOS_VALIDATOR, useClass: MockProductosValidator }, 
  ],
  exports: [
    // Exportamos los tokens de los servicios para que otros módulos los puedan inyectar
    MARCA_SERVICE,
    LINEA_SERVICE, // ✅ Exportamos el servicio de Línea
    // Exportamos TypeOrmModule para dar acceso a las entidades a otros módulos
    TypeOrmModule, 
  ],
})
export class CatalogoModule {}