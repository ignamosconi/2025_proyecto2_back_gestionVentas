import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProveedorUniqueConstraint1729612800000 implements MigrationInterface {
    name = 'UpdateProveedorUniqueConstraint1729612800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Eliminar el índice si ya existe
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_PROVEEDOR_NOMBRE_ACTIVE";
        `);
        
        // Eliminar el constraint UNIQUE anterior
        await queryRunner.query(`
            ALTER TABLE "proveedor" 
            DROP CONSTRAINT IF EXISTS "UQ_nombre";
        `);
        
        // Eliminar el índice único si existe (nombre alternativo)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_nombre";
        `);
        
        // Buscar y eliminar cualquier constraint con patrón UQ_*nombre*
        await queryRunner.query(`
            DO $$ 
            DECLARE
                constraint_name TEXT;
            BEGIN
                FOR constraint_name IN 
                    SELECT conname 
                    FROM pg_constraint 
                    WHERE conrelid = 'proveedor'::regclass 
                    AND contype = 'u' 
                    AND conname LIKE '%nombre%'
                LOOP
                    EXECUTE 'ALTER TABLE proveedor DROP CONSTRAINT IF EXISTS ' || constraint_name;
                END LOOP;
            END $$;
        `);

        // Crear un índice único parcial que solo aplica cuando deletedAt IS NULL
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_PROVEEDOR_NOMBRE_ACTIVE" 
            ON "proveedor" ("nombre") 
            WHERE "deletedAt" IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar el índice único parcial
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_PROVEEDOR_NOMBRE_ACTIVE";
        `);

        // Restaurar el constraint UNIQUE original
        await queryRunner.query(`
            ALTER TABLE "proveedor" 
            ADD CONSTRAINT "UQ_nombre" UNIQUE ("nombre");
        `);
    }
}
