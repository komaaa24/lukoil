import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1710000000000 implements MigrationInterface {
  name = 'InitialMigration1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(
      `CREATE TYPE "scan_events_source_enum" AS ENUM('DEEPLINK', 'MANUAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "admins_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "broadcasts_target_enum" AS ENUM('ALL_USERS', 'USERS_WITH_PHONE', 'USERS_WITH_ACTIVE_SUBS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "broadcasts_status_enum" AS ENUM('DRAFT', 'SCHEDULED', 'SENDING', 'DONE', 'FAILED')`,
    );
    await queryRunner.query(`CREATE TYPE "broadcast_logs_status_enum" AS ENUM('SENT', 'FAILED')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "telegramId" bigint NOT NULL,
        "username" varchar(255),
        "firstName" varchar(255),
        "lastName" varchar(255),
        "phoneNumber" varchar(32),
        "languageCode" varchar(10),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_telegram" UNIQUE ("telegramId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_telegram" ON "users" ("telegramId")`);

    await queryRunner.query(`
      CREATE TABLE "product_tokens" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "token" varchar(128) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_tokens_token" UNIQUE ("token")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_product_tokens_token" ON "product_tokens" ("token")`);

    await queryRunner.query(`
      CREATE TABLE "scan_events" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "tokenRaw" varchar(128) NOT NULL,
        "scannedAt" timestamptz NOT NULL,
        "source" "scan_events_source_enum" NOT NULL DEFAULT 'DEEPLINK',
        "userId" uuid NOT NULL,
        "productTokenId" uuid,
        CONSTRAINT "PK_scan_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_scan_events_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_scan_events_product_token" FOREIGN KEY ("productTokenId") REFERENCES "product_tokens"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_scan_events_scannedAt" ON "scan_events" ("scannedAt")`);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "reminderDayOfMonth" integer NOT NULL DEFAULT 1,
        "timezone" varchar(64) NOT NULL DEFAULT 'Asia/Tashkent',
        "isActive" boolean NOT NULL DEFAULT true,
        "nextRunAt" timestamptz NOT NULL,
        "lastSentAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "productTokenId" uuid NOT NULL,
        CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscriptions_user_product" UNIQUE ("userId", "productTokenId"),
        CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscriptions_product_token" FOREIGN KEY ("productTokenId") REFERENCES "product_tokens"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_nextRunAt" ON "subscriptions" ("nextRunAt")`);

    await queryRunner.query(`
      CREATE TABLE "admins" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "telegramId" bigint NOT NULL,
        "role" "admins_role_enum" NOT NULL DEFAULT 'ADMIN',
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_admins_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admins_telegram" UNIQUE ("telegramId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_admins_telegram" ON "admins" ("telegramId")`);

    await queryRunner.query(`
      CREATE TABLE "broadcasts" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "messageText" text NOT NULL,
        "target" "broadcasts_target_enum" NOT NULL DEFAULT 'ALL_USERS',
        "status" "broadcasts_status_enum" NOT NULL DEFAULT 'DRAFT',
        "scheduledAt" timestamptz,
        "sentCount" integer NOT NULL DEFAULT 0,
        "failCount" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "createdByAdminId" uuid NOT NULL,
        CONSTRAINT "PK_broadcasts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_broadcasts_admin" FOREIGN KEY ("createdByAdminId") REFERENCES "admins"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "broadcast_logs" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "status" "broadcast_logs_status_enum" NOT NULL,
        "error" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "broadcastId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_broadcast_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_broadcast_logs_broadcast" FOREIGN KEY ("broadcastId") REFERENCES "broadcasts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_broadcast_logs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "broadcast_logs"`);
    await queryRunner.query(`DROP TABLE "broadcasts"`);
    await queryRunner.query(`DROP INDEX "IDX_admins_telegram"`);
    await queryRunner.query(`DROP TABLE "admins"`);
    await queryRunner.query(`DROP INDEX "IDX_subscriptions_nextRunAt"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP INDEX "IDX_scan_events_scannedAt"`);
    await queryRunner.query(`DROP TABLE "scan_events"`);
    await queryRunner.query(`DROP INDEX "IDX_product_tokens_token"`);
    await queryRunner.query(`DROP TABLE "product_tokens"`);
    await queryRunner.query(`DROP INDEX "IDX_users_telegram"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "broadcast_logs_status_enum"`);
    await queryRunner.query(`DROP TYPE "broadcasts_status_enum"`);
    await queryRunner.query(`DROP TYPE "broadcasts_target_enum"`);
    await queryRunner.query(`DROP TYPE "admins_role_enum"`);
    await queryRunner.query(`DROP TYPE "scan_events_source_enum"`);
  }
}
