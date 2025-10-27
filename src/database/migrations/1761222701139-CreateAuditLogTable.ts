import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogTable1761222701139 implements MigrationInterface {
  name = 'CreateAuditLogTable1761222701139';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "producto" DROP CONSTRAINT "FK_5a87a36fc99bfeab351d9d54e50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" DROP CONSTRAINT "FK_116783c6bfbff483096740514be"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_USERS_EMAIL"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_PROVEEDOR_NOMBRE"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_PRODUCTO_PROVEEDOR_UNIQUE"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_LINEA_NOMBRE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MARCA_NOMBRE"`);
    await queryRunner.query(
      `CREATE TYPE "public"."registro_auditoria_tipo_evento_enum" AS ENUM('login-usuario', 'crear-empleado', 'crear-duenio', 'registrar-venta', 'registrar-compra')`,
    );
    await queryRunner.query(
      `CREATE TABLE "registro_auditoria" ("idAuditoria" SERIAL NOT NULL, "fecha_hora" TIMESTAMP NOT NULL DEFAULT now(), "tipo_evento" "public"."registro_auditoria_tipo_evento_enum" NOT NULL, "detalle" text, "userId" integer NOT NULL, CONSTRAINT "PK_d4864cb838dcae92a440859d1c0" PRIMARY KEY ("idAuditoria"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "proveedor" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "proveedor" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "linea" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "linea" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "marca_linea" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "marca_linea" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "marca" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "marca" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bd52c019663f6a099ef42b70c4" ON "linea" ("nombre") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4e6b4984c6761c6a15daa395fd" ON "marca" ("nombre") `,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" ADD CONSTRAINT "UQ_1ab888e8840814edf000bce00c9" UNIQUE ("idProducto", "idProveedor")`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" ADD CONSTRAINT "FK_5a87a36fc99bfeab351d9d54e50" FOREIGN KEY ("id_linea") REFERENCES "linea"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" ADD CONSTRAINT "FK_116783c6bfbff483096740514be" FOREIGN KEY ("id_marca") REFERENCES "marca"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "registro_auditoria" ADD CONSTRAINT "FK_25e1061ddf47c5c9577bb1c8da9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "registro_auditoria" DROP CONSTRAINT "FK_25e1061ddf47c5c9577bb1c8da9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" DROP CONSTRAINT "FK_116783c6bfbff483096740514be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" DROP CONSTRAINT "FK_5a87a36fc99bfeab351d9d54e50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" DROP CONSTRAINT "UQ_1ab888e8840814edf000bce00c9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e6b4984c6761c6a15daa395fd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd52c019663f6a099ef42b70c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marca" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "marca" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "marca_linea" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "marca_linea" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "linea" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "linea" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_proveedor" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "proveedor" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "proveedor" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`DROP TABLE "registro_auditoria"`);
    await queryRunner.query(
      `DROP TYPE "public"."registro_auditoria_tipo_evento_enum"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_MARCA_NOMBRE" ON "marca" ("nombre") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_LINEA_NOMBRE" ON "linea" ("nombre") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_PRODUCTO_PROVEEDOR_UNIQUE" ON "producto_proveedor" ("idProducto", "idProveedor") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_PROVEEDOR_NOMBRE" ON "proveedor" ("nombre") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USERS_EMAIL" ON "users" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" ADD CONSTRAINT "FK_116783c6bfbff483096740514be" FOREIGN KEY ("id_marca") REFERENCES "marca"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto" ADD CONSTRAINT "FK_5a87a36fc99bfeab351d9d54e50" FOREIGN KEY ("id_linea") REFERENCES "linea"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
