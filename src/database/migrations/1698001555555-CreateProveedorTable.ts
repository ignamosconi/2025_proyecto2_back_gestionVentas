import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProveedorTable1698001555555 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'proveedor',
        columns: [
          {
            name: 'idProveedor',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'nombre',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'direccion',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'telefono',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add unique index for nombre
    await queryRunner.createIndex(
      'proveedor',
      new TableIndex({
        name: 'IDX_PROVEEDOR_NOMBRE',
        columnNames: ['nombre'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('proveedor', 'IDX_PROVEEDOR_NOMBRE');
    await queryRunner.dropTable('proveedor');
  }
}