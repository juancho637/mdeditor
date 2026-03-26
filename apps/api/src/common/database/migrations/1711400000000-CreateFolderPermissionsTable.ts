import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableUnique } from 'typeorm';

export class CreateFolderPermissionsTable1711400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'folder_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'folder_id',
            type: 'uuid',
          },
          {
            name: 'group_id',
            type: 'uuid',
          },
          {
            name: 'permission_level',
            type: 'varchar',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
        uniques: [
          new TableUnique({ columnNames: ['folder_id', 'group_id'] }),
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'folder_permissions',
      new TableIndex({ name: 'idx_folder_permissions_folder_id', columnNames: ['folder_id'] }),
    );

    await queryRunner.createIndex(
      'folder_permissions',
      new TableIndex({ name: 'idx_folder_permissions_group_id', columnNames: ['group_id'] }),
    );

    await queryRunner.createForeignKey(
      'folder_permissions',
      new TableForeignKey({
        columnNames: ['folder_id'],
        referencedTableName: 'folders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'folder_permissions',
      new TableForeignKey({
        columnNames: ['group_id'],
        referencedTableName: 'groups',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('folder_permissions');
  }
}
