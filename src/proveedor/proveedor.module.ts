// src/proveedores/proveedor.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Proveedor } from './entities/proveedor.entity';
import { ProductoProveedor } from './entities/producto-proveedor.entity';

import { ProveedorController } from './controllers/proveedor.controller';
import { ProductoProveedorController } from './controllers/producto-proveedor.controller';

import { ProveedorRepository } from './repositories/proveedor.repository';
import { ProductoProveedorRepository } from './repositories/producto-proveedor.repository';

import { ProveedorService } from './services/proveedor.service';
import { ProductoProveedorService } from './services/producto-proveedor.service';

import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { ProductoModule } from 'src/producto/producto.module'; // <-- para PRODUCTO_SERVICE

import { 
    PROVEEDOR_REPOSITORY, 
    PROVEEDOR_SERVICE,
    PRODUCTO_PROVEEDOR_REPOSITORY,
    PRODUCTO_PROVEEDOR_SERVICE
} from '../constants';

@Module({
    imports: [
        TypeOrmModule.forFeature([Proveedor, ProductoProveedor]),
        AuthModule,       // Para AuthGuard y RolesGuard
        UsersModule,      // Para la verificación de roles
        ProductoModule,   // Para inyectar ProductoService y validar existencia
    ],
    controllers: [ProveedorController, ProductoProveedorController],
    providers: [
        {
            provide: PROVEEDOR_REPOSITORY,
            useClass: ProveedorRepository,
        },
        {
            provide: PROVEEDOR_SERVICE,
            useClass: ProveedorService,
        },
        {
            provide: PRODUCTO_PROVEEDOR_REPOSITORY,
            useClass: ProductoProveedorRepository,
        },
        {
            provide: PRODUCTO_PROVEEDOR_SERVICE,
            useClass: ProductoProveedorService,
        },
    ],
    exports: [PROVEEDOR_SERVICE, PRODUCTO_PROVEEDOR_SERVICE],
})
export class ProveedorModule {}
