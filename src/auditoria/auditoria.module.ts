import { forwardRef, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditoriaController } from './controllers/auditoria.controller';
import { AuditoriaService } from './services/auditoria.service';
import { AuditoriaRepository } from './repositories/auditoria.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './entities/registro-auditoria.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuditoriaController],
  providers: [
    {
      provide: 'IAuditoriaRepository',
      useFactory: (dataSource: DataSource) =>
        new AuditoriaRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: 'IAuditoriaService',
      useClass: AuditoriaService,
    },
  ],
  exports: ['IAuditoriaService'],
})
export class AuditoriaModule {}
