import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModificarEventosToAuditEnum1761300000000 implements MigrationInterface {
    name = 'AddModificarEventosToAuditEnum1761300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregamos nuevos valores al enum usado por la tabla registro_auditoria
        await queryRunner.query(`ALTER TYPE "public"."registro_auditoria_tipo_evento_enum" ADD VALUE 'modificar-venta'`);
        await queryRunner.query(`ALTER TYPE "public"."registro_auditoria_tipo_evento_enum" ADD VALUE 'modificar-compra'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Atención: PostgreSQL no permite remover fácilmente valores de un ENUM.
        // Para mantener la migración simple y segura, no hacemos rollback de estos valores.
    }

}
