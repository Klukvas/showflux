import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaddleSubscriptionFields1710500000000
  implements MigrationInterface
{
  name = 'AddPaddleSubscriptionFields1710500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscription status enum
    await queryRunner.query(
      `CREATE TYPE "subscription_status_enum" AS ENUM ('trialing', 'active', 'past_due', 'paused', 'canceled')`,
    );

    // Drop old Stripe columns
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "stripe_customer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "stripe_subscription_id"`,
    );

    // Add new Paddle columns
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "paddle_customer_id" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "paddle_subscription_id" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "subscription_status" "subscription_status_enum" NOT NULL DEFAULT 'trialing'`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "current_period_end" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "trial_ends_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "trial_ends_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "current_period_end"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "subscription_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "paddle_subscription_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "paddle_customer_id"`,
    );
    await queryRunner.query(`DROP TYPE "subscription_status_enum"`);

    // Restore old Stripe columns
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "stripe_customer_id" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "stripe_subscription_id" varchar`,
    );
  }
}
