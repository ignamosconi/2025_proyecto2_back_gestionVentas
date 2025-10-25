import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { VentaRepository } from './repositories/venta.repository';
import { VentaService } from './services/venta.service';
import { VentaController } from './controllers/venta.controller';
import { VENTA_REPOSITORY, VENTA_SERVICE } from '../constants';
import { Producto } from '../producto/entities/producto.entity';
import { ProductoModule } from '../producto/producto.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta, Producto]), 
    AuthModule, 
    UsersModule, 
    ProductoModule,
    AuditoriaModule,
  ],
  controllers: [VentaController],
  providers: [
    {
      provide: VENTA_REPOSITORY,
      useClass: VentaRepository,
    },
    {
      provide: VENTA_SERVICE,
      useClass: VentaService,
    },
  ],
  exports: [VENTA_SERVICE],
})
export class VentaModule {}