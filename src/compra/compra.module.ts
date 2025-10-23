// 📄 src/compras/compra.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades de Compra
import { Compra } from './entities/compra.entity'; // Asumo la ruta
import { DetalleCompra } from './entities/detalle-compra.entity'; // Asumo la ruta
// Componentes del Módulo
import { CompraRepository } from './repositories/compra.repository';
import { CompraService } from './services/compra.service';
import { CompraController } from './controllers/compra.controller';
// Constantes
import { COMPRA_REPOSITORY, COMPRA_SERVICE } from '../constants'; // Asumo la ruta
// Dependencias Compartidas
import { ProductoModule } from 'src/producto/producto.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { ProveedorModule } from 'src/proveedor/proveedor.module';

@Module({
  imports: [
    // 1. Registrar entidades de Compra y DetalleCompra con TypeORM
    TypeOrmModule.forFeature([Compra, DetalleCompra]), 
    // 2. Módulos que el servicio necesita para sus inyecciones (Usuario, Producto, Proveedor)
    AuthModule, 
    UsersModule, 
    ProductoModule,
    ProveedorModule // Necesario para inyectar IProveedorRepository en CompraService
  ],
  controllers: [CompraController],
  providers: [
    // 3. Proveer el Repositorio
    {
      provide: COMPRA_REPOSITORY,
      useClass: CompraRepository,
    },
    // 4. Proveer el Servicio
    {
      provide: COMPRA_SERVICE,
      useClass: CompraService,
    },
  ],
  // Exportar el servicio para que otros módulos puedan inyectar CompraServiceInterface
  exports: [COMPRA_SERVICE], 
})
export class CompraModule {}