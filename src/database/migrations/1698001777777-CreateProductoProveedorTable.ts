import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProductoProveedorTable1698001777777 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'producto_proveedor',
        columns: [
          {
            name: 'idProductoProveedor',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'idProducto',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'idProveedor',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'codigoProveedor',
            type: 'varchar',
            isNullable: false,
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

    // Add unique constraint for producto-proveedor combination
    await queryRunner.createIndex(
      'producto_proveedor',
      new TableIndex({
        name: 'IDX_PRODUCTO_PROVEEDOR_UNIQUE',
        columnNames: ['idProducto', 'idProveedor'],
        isUnique: true,
      }),
    );

    // Add foreign key for idProducto
    await queryRunner.createForeignKey(
      'producto_proveedor',
      new TableForeignKey({
        columnNames: ['idProducto'],
        referencedColumnNames: ['idProducto'],
        referencedTableName: 'producto',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for idProveedor
    await queryRunner.createForeignKey(
      'producto_proveedor',
      new TableForeignKey({
        columnNames: ['idProveedor'],
        referencedColumnNames: ['idProveedor'],
        referencedTableName: 'proveedor',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('producto_proveedor');
    const foreignKeyProducto = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('idProducto') !== -1,
    );
    const foreignKeyProveedor = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('idProveedor') !== -1,
    );
    
    if (foreignKeyProducto) {
      await queryRunner.dropForeignKey('producto_proveedor', foreignKeyProducto);
    }
    
    if (foreignKeyProveedor) {
      await queryRunner.dropForeignKey('producto_proveedor', foreignKeyProveedor);
    }
    
    await queryRunner.dropIndex('producto_proveedor', 'IDX_PRODUCTO_PROVEEDOR_UNIQUE');
    await queryRunner.dropTable('producto_proveedor');
  }
}