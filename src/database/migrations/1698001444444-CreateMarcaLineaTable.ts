import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateMarcaLineaTable1698001444444 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'marca_linea',
        columns: [
          {
            name: 'marcaId',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'lineaId',
            type: 'int',
            isPrimary: true,
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

    // Add foreign key for marcaId
    await queryRunner.createForeignKey(
      'marca_linea',
      new TableForeignKey({
        columnNames: ['marcaId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'marca',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for lineaId
    await queryRunner.createForeignKey(
      'marca_linea',
      new TableForeignKey({
        columnNames: ['lineaId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'linea',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('marca_linea');
    const foreignKeyMarca = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('marcaId') !== -1,
    );
    const foreignKeyLinea = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('lineaId') !== -1,
    );

    if (foreignKeyMarca) {
      await queryRunner.dropForeignKey('marca_linea', foreignKeyMarca);
    }

    if (foreignKeyLinea) {
      await queryRunner.dropForeignKey('marca_linea', foreignKeyLinea);
    }

    await queryRunner.dropTable('marca_linea');
  }
}
