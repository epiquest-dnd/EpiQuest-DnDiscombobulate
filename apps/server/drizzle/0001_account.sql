CREATE SCHEMA "game";
--> statement-breakpoint
CREATE SCHEMA "rules";
--> statement-breakpoint
CREATE TYPE "game"."auth_client" AS ENUM('web', 'mobile');--> statement-breakpoint
CREATE TYPE "game"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "game"."app_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" "game"."user_role" DEFAULT 'user' NOT NULL,
	"email" "citext" NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"preferences" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "game"."auth_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"client" "game"."auth_client" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_session_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "game"."auth_session" ADD CONSTRAINT "auth_session_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "game"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_session_user_id_idx" ON "game"."auth_session" USING btree ("user_id");