import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchVector1711700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" ADD COLUMN "search_vector" tsvector`,
    );

    await queryRunner.query(`
      UPDATE "documents"
      SET "search_vector" = to_tsvector('simple',
        COALESCE("title", '') || ' ' || COALESCE("content_markdown", '')
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_documents_search_vector"
      ON "documents" USING GIN("search_vector")
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_document_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := to_tsvector('simple',
          COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content_markdown, '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_document_search_vector
      BEFORE INSERT OR UPDATE OF title, content_markdown
      ON "documents"
      FOR EACH ROW EXECUTE FUNCTION update_document_search_vector()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_document_search_vector ON "documents"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_document_search_vector`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_documents_search_vector"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP COLUMN IF EXISTS "search_vector"`,
    );
  }
}
