import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddYjsCollaborationTables1711500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add yjs_state column to documents table
    await queryRunner.query(`ALTER TABLE "documents" ADD COLUMN "yjs_state" bytea`);

    // Create document_updates table
    await queryRunner.createTable(
      new Table({
        name: 'document_updates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'document_id', type: 'uuid' },
          { name: 'yjs_update', type: 'bytea' },
          { name: 'author_id', type: 'uuid' },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'document_updates',
      new TableForeignKey({
        columnNames: ['document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'documents',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'document_updates',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'document_updates',
      new TableIndex({
        name: 'idx_document_updates_document_id_created_at',
        columnNames: ['document_id', 'created_at'],
      }),
    );

    // Create document_snapshots table
    await queryRunner.createTable(
      new Table({
        name: 'document_snapshots',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'document_id', type: 'uuid' },
          { name: 'yjs_snapshot', type: 'bytea' },
          { name: 'content_markdown', type: 'text' },
          { name: 'author_id', type: 'uuid', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'document_snapshots',
      new TableForeignKey({
        columnNames: ['document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'documents',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'document_snapshots',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'document_snapshots',
      new TableIndex({
        name: 'idx_document_snapshots_document_id_created_at',
        columnNames: ['document_id', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('document_snapshots', true);
    await queryRunner.dropTable('document_updates', true);
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "yjs_state"`);
  }
}
