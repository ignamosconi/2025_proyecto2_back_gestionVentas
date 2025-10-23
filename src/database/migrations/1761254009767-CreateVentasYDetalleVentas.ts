import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVentasYDetalleVentas1761254009767 implements MigrationInterface {
    name = 'CreateVentasYDetalleVentas1761254009767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "detalle_venta" ("idDetalleVenta" SERIAL NOT NULL, "cantidad" integer NOT NULL, "precioUnitario" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, "idProducto" integer NOT NULL, "idVenta" integer, CONSTRAINT "PK_59761dc01cc3266eb37a4ac3440" PRIMARY KEY ("idDetalleVenta"))`);
        await queryRunner.query(`CREATE TYPE "public"."venta_metodopago_enum" AS ENUM('Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Efectivo', 'Otro')`);
        await queryRunner.query(`CREATE TABLE "venta" ("idVenta" SERIAL NOT NULL, "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(), "metodoPago" "public"."venta_metodopago_enum" NOT NULL, "total" numeric(10,2) NOT NULL, "id_usuario" integer, CONSTRAINT "PK_7fe75ea53ff542d6f3bda936478" PRIMARY KEY ("idVenta"))`);
        await queryRunner.query(`ALTER TABLE "detalle_venta" ADD CONSTRAINT "FK_3c2f63d187f11439573622a292b" FOREIGN KEY ("idVenta") REFERENCES "venta"("idVenta") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalle_venta" ADD CONSTRAINT "FK_3d095133c02301cb7f8caf3101b" FOREIGN KEY ("idProducto") REFERENCES "producto"("idProducto") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "venta" ADD CONSTRAINT "FK_20f57a0cfaec67d68d88ff8420d" FOREIGN KEY ("id_usuario") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venta" DROP CONSTRAINT "FK_20f57a0cfaec67d68d88ff8420d"`);
        await queryRunner.query(`ALTER TABLE "detalle_venta" DROP CONSTRAINT "FK_3d095133c02301cb7f8caf3101b"`);
        await queryRunner.query(`ALTER TABLE "detalle_venta" DROP CONSTRAINT "FK_3c2f63d187f11439573622a292b"`);
        await queryRunner.query(`DROP TABLE "venta"`);
        await queryRunner.query(`DROP TYPE "public"."venta_metodopago_enum"`);
        await queryRunner.query(`DROP TABLE "detalle_venta"`);
    }

}
