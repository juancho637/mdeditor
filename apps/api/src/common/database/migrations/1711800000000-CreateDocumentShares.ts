import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentShares1711800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "document_shares" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "document_id" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
        "share_token" VARCHAR(64) NOT NULL,
        "created_by" UUID NOT NULL REFERENCES "users"("id"),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_document_shares_token" UNIQUE ("share_token"),
        CONSTRAINT "uq_document_shares_document" UNIQUE ("document_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_document_shares_token"
      ON "document_shares" ("share_token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_document_shares_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_shares"`);
  }
}
