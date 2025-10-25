import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateProductoTable1698001666666 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'producto',
        columns: [
          {
            name: 'idProducto',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'nombre',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'descripcion',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'precio',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'stock',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'alerta_stock',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'foto',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'id_linea',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'id_marca',
            type: 'int',
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
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign key for id_linea
    await queryRunner.createForeignKey(
      'producto',
      new TableForeignKey({
        columnNames: ['id_linea'],
        referencedColumnNames: ['id'],
        referencedTableName: 'linea',
        onDelete: 'RESTRICT', // Prevent deletion of línea if products exist
      }),
    );

    // Add foreign key for id_marca
    await queryRunner.createForeignKey(
      'producto',
      new TableForeignKey({
        columnNames: ['id_marca'],
        referencedColumnNames: ['id'],
        referencedTableName: 'marca',
        onDelete: 'RESTRICT', // Prevent deletion of marca if products exist
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('producto');
    const foreignKeyLinea = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('id_linea') !== -1,
    );
    const foreignKeyMarca = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('id_marca') !== -1,
    );

    if (foreignKeyLinea) {
      await queryRunner.dropForeignKey('producto', foreignKeyLinea);
    }

    if (foreignKeyMarca) {
      await queryRunner.dropForeignKey('producto', foreignKeyMarca);
    }

    await queryRunner.dropTable('producto');
  }
}
