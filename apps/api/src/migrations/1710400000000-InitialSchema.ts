import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710400000000 implements MigrationInterface {
  name = 'InitialSchema1710400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enum types
    await queryRunner.query(
      `CREATE TYPE "plan_enum" AS ENUM ('solo', 'team', 'agency')`,
    );
    await queryRunner.query(
      `CREATE TYPE "role_enum" AS ENUM ('broker', 'agent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "listing_status_enum" AS ENUM ('active', 'pending', 'sold', 'withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TYPE "showing_status_enum" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show')`,
    );
    await queryRunner.query(
      `CREATE TYPE "offer_status_enum" AS ENUM ('submitted', 'accepted', 'rejected', 'countered', 'withdrawn', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "invite_status_enum" AS ENUM ('pending', 'accepted', 'expired', 'revoked')`,
    );
    await queryRunner.query(
      `CREATE TYPE "activity_action_enum" AS ENUM ('listing_created', 'listing_updated', 'listing_deleted', 'showing_scheduled', 'showing_updated', 'showing_completed', 'offer_submitted', 'offer_accepted', 'offer_rejected', 'offer_updated', 'invite_sent', 'invite_accepted', 'member_deactivated', 'member_reactivated')`,
    );

    // Workspaces
    await queryRunner.query(`
      CREATE TABLE "workspaces" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "plan" "plan_enum" NOT NULL DEFAULT 'solo',
        "stripe_customer_id" varchar,
        "stripe_subscription_id" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspaces" PRIMARY KEY ("id")
      )
    `);

    // Users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar NOT NULL,
        "role" "role_enum" NOT NULL,
        "full_name" varchar(255) NOT NULL,
        "avatar_url" varchar,
        "is_active" boolean NOT NULL DEFAULT true,
        "token_version" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Listings
    await queryRunner.query(`
      CREATE TABLE "listings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "address" varchar(255) NOT NULL,
        "city" varchar(100) NOT NULL,
        "state" varchar(2) NOT NULL,
        "zip" varchar(10) NOT NULL,
        "mls_number" varchar(50),
        "price" decimal(12,2) NOT NULL,
        "bedrooms" smallint,
        "bathrooms" decimal(4,1),
        "sqft" int,
        "status" "listing_status_enum" NOT NULL DEFAULT 'active',
        "listing_agent_id" uuid NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_listings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_listings_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_listings_agent" FOREIGN KEY ("listing_agent_id")
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Showings
    await queryRunner.query(`
      CREATE TABLE "showings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "listing_id" uuid NOT NULL,
        "agent_id" uuid NOT NULL,
        "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "duration" smallint NOT NULL DEFAULT 30,
        "status" "showing_status_enum" NOT NULL DEFAULT 'scheduled',
        "feedback" text,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_showings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_showings_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_showings_listing" FOREIGN KEY ("listing_id")
          REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_showings_agent" FOREIGN KEY ("agent_id")
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Offers
    await queryRunner.query(`
      CREATE TABLE "offers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "listing_id" uuid NOT NULL,
        "agent_id" uuid NOT NULL,
        "buyer_name" varchar(255) NOT NULL,
        "offer_amount" decimal(12,2) NOT NULL,
        "status" "offer_status_enum" NOT NULL DEFAULT 'submitted',
        "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "expiration_date" TIMESTAMP WITH TIME ZONE,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_offers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_offers_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_offers_listing" FOREIGN KEY ("listing_id")
          REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_offers_agent" FOREIGN KEY ("agent_id")
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Invites
    await queryRunner.query(`
      CREATE TABLE "invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "invited_by" uuid NOT NULL,
        "email" varchar(255) NOT NULL,
        "token" varchar NOT NULL,
        "status" "invite_status_enum" NOT NULL DEFAULT 'pending',
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invites_token" UNIQUE ("token"),
        CONSTRAINT "PK_invites" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invites_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_invites_inviter" FOREIGN KEY ("invited_by")
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Password resets
    await queryRunner.query(`
      CREATE TABLE "password_resets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" varchar(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_resets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_resets_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Activities
    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "action" "activity_action_enum" NOT NULL,
        "entity_type" varchar(50) NOT NULL,
        "entity_id" uuid NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activities" PRIMARY KEY ("id"),
        CONSTRAINT "FK_activities_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_activities_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX "idx_listings_workspace_id" ON "listings" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_listings_workspace_status" ON "listings" ("workspace_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_showings_workspace_id" ON "showings" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_showings_listing_id" ON "showings" ("listing_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_showings_workspace_scheduled" ON "showings" ("workspace_id", "scheduled_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_offers_workspace_id" ON "offers" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_offers_listing_id" ON "offers" ("listing_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_offers_workspace_status" ON "offers" ("workspace_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invites_workspace_id" ON "invites" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_invites_token" ON "invites" ("token")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_invites_workspace_email_pending" ON "invites" ("workspace_id", "email") WHERE "status" = 'pending'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_password_resets_token" ON "password_resets" ("token")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activities_workspace_id" ON "activities" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activities_workspace_created" ON "activities" ("workspace_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "activities" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_resets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invites" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "offers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "showings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "listings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspaces" CASCADE`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_action_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invite_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "offer_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "showing_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "listing_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_enum"`);
  }
}
