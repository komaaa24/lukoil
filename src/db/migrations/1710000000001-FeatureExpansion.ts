import { MigrationInterface, QueryRunner } from 'typeorm';

export class FeatureExpansion1710000000001 implements MigrationInterface {
  name = 'FeatureExpansion1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "admins_role_enum" ADD VALUE IF NOT EXISTS 'MODERATOR'`);
    await queryRunner.query(
      `ALTER TYPE "broadcasts_target_enum" ADD VALUE IF NOT EXISTS 'SCANNED_LAST_30_DAYS'`,
    );
    await queryRunner.query(
      `ALTER TYPE "broadcasts_target_enum" ADD VALUE IF NOT EXISTS 'BY_OIL_TYPE'`,
    );
    await queryRunner.query(`ALTER TABLE "broadcasts" ADD "filterValue" varchar(64)`);

    await queryRunner.query(
      `CREATE TYPE "users_mileageMode_enum" AS ENUM('MONTHLY', 'KM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "vehicleBrand" varchar(64), ADD "oilType" varchar(32), ADD "mileageMode" "users_mileageMode_enum" NOT NULL DEFAULT 'MONTHLY', ADD "mileageCurrent" integer NOT NULL DEFAULT 0, ADD "mileageThreshold" integer NOT NULL DEFAULT 5000, ADD "referralCode" varchar(32), ADD "points" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_referral_code" ON "users" ("referralCode")`,
    );

    await queryRunner.query(
      `CREATE TYPE "subscriptions_mode_enum" AS ENUM('MONTHLY', 'KM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "mode" "subscriptions_mode_enum" NOT NULL DEFAULT 'MONTHLY', ADD "lastConfirmedAt" timestamptz, ADD "snoozedUntil" timestamptz`,
    );

    await queryRunner.query(
      `CREATE TYPE "complaints_reason_enum" AS ENUM('UNKNOWN_TOKEN','DUPLICATE','DAMAGED','OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "complaints_status_enum" AS ENUM('OPEN','RESOLVED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "complaints" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "tokenRaw" varchar(128) NOT NULL,
        "reason" "complaints_reason_enum" NOT NULL,
        "text" text,
        "status" "complaints_status_enum" NOT NULL DEFAULT 'OPEN',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "resolvedAt" timestamptz,
        "userId" uuid NOT NULL,
        "resolvedByAdminId" uuid,
        CONSTRAINT "PK_complaints_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_complaints_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_complaints_admin" FOREIGN KEY ("resolvedByAdminId") REFERENCES "admins"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "referrals" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "inviterId" uuid NOT NULL,
        "invitedId" uuid NOT NULL,
        CONSTRAINT "PK_referrals_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_referral_inviter" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_referral_invited" FOREIGN KEY ("invitedId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "promo_codes_status_enum" AS ENUM('ISSUED','USED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "promo_codes" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "code" varchar(64) NOT NULL,
        "status" "promo_codes_status_enum" NOT NULL DEFAULT 'ISSUED',
        "issuedAt" timestamptz NOT NULL DEFAULT now(),
        "usedAt" timestamptz,
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_promo_codes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_promo_codes_code" UNIQUE ("code"),
        CONSTRAINT "FK_promo_codes_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "service_centers" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "name" varchar(255) NOT NULL,
        "phone" varchar(64),
        "address" varchar(255) NOT NULL,
        "lat" double precision NOT NULL,
        "lon" double precision NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_service_centers_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_service_centers_lat" ON "service_centers" ("lat")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_centers_lon" ON "service_centers" ("lon")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_centers_lon"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_centers_lat"`);
    await queryRunner.query(`DROP TABLE "service_centers"`);

    await queryRunner.query(`DROP TABLE "promo_codes"`);
    await queryRunner.query(`DROP TYPE "promo_codes_status_enum"`);

    await queryRunner.query(`DROP TABLE "referrals"`);

    await queryRunner.query(`DROP TABLE "complaints"`);
    await queryRunner.query(`DROP TYPE "complaints_status_enum"`);
    await queryRunner.query(`DROP TYPE "complaints_reason_enum"`);

    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "mode", DROP COLUMN "lastConfirmedAt", DROP COLUMN "snoozedUntil"`,
    );
    await queryRunner.query(`DROP TYPE "subscriptions_mode_enum"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_referral_code"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "vehicleBrand", DROP COLUMN "oilType", DROP COLUMN "mileageMode", DROP COLUMN "mileageCurrent", DROP COLUMN "mileageThreshold", DROP COLUMN "referralCode", DROP COLUMN "points"`,
    );
    await queryRunner.query(`DROP TYPE "users_mileageMode_enum"`);

    await queryRunner.query(`ALTER TABLE "broadcasts" DROP COLUMN "filterValue"`);
    // Note: cannot easily drop added enum values; leaving as-is on down migration.
  }
}
