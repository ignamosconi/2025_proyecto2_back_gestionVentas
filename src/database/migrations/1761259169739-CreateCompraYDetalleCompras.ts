import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompraYDetalleCompras1761259169739
  implements MigrationInterface
{
  name = 'CreateCompraYDetalleCompras1761259169739';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "detalle_compra" ("idDetalleCompra" SERIAL NOT NULL, "cantidad" integer NOT NULL, "precioUnitario" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, "idCompra" integer, "idProducto" integer, CONSTRAINT "PK_547abf3636a9369e9ee9e0853ed" PRIMARY KEY ("idDetalleCompra"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."compra_metodopago_enum" AS ENUM('Efectivo', 'Tarjeta de débito', 'Tarjeta de crédito', 'Transferencia', 'Crédito', 'Cheque')`,
    );
    await queryRunner.query(
      `CREATE TABLE "compra" ("idCompra" SERIAL NOT NULL, "fechaCreacion" date NOT NULL, "metodoPago" "public"."compra_metodopago_enum" NOT NULL, "total" numeric(10,2) NOT NULL, "idProveedor" integer, "idUsuario" integer, CONSTRAINT "PK_3140b2d2b8f6df1aec3c8766147" PRIMARY KEY ("idCompra"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "detalle_compra" ADD CONSTRAINT "FK_55d14bca05ea4493132e2f66a1b" FOREIGN KEY ("idCompra") REFERENCES "compra"("idCompra") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "detalle_compra" ADD CONSTRAINT "FK_d29033370c7e0c163a5ff9fab55" FOREIGN KEY ("idProducto") REFERENCES "producto"("idProducto") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "compra" ADD CONSTRAINT "FK_34ca8d27c9a1b1ee0d17ac21170" FOREIGN KEY ("idProveedor") REFERENCES "proveedor"("idProveedor") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "compra" ADD CONSTRAINT "FK_12e2c800795db8c9ed0040b13d9" FOREIGN KEY ("idUsuario") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "compra" DROP CONSTRAINT "FK_12e2c800795db8c9ed0040b13d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "compra" DROP CONSTRAINT "FK_34ca8d27c9a1b1ee0d17ac21170"`,
    );
    await queryRunner.query(
      `ALTER TABLE "detalle_compra" DROP CONSTRAINT "FK_d29033370c7e0c163a5ff9fab55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "detalle_compra" DROP CONSTRAINT "FK_55d14bca05ea4493132e2f66a1b"`,
    );
    await queryRunner.query(`DROP TABLE "compra"`);
    await queryRunner.query(`DROP TYPE "public"."compra_metodopago_enum"`);
    await queryRunner.query(`DROP TABLE "detalle_compra"`);
  }
}
