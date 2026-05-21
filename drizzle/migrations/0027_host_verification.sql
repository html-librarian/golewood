CREATE TYPE "public"."host_legal_type" AS ENUM('company', 'individual');
--> statement-breakpoint
CREATE TABLE "host_legal_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"legal_type" "host_legal_type" DEFAULT 'company' NOT NULL,
	"legal_name" varchar(255) DEFAULT '' NOT NULL,
	"inn" varchar(12) DEFAULT '' NOT NULL,
	"ogrn" varchar(15),
	"legal_address" text DEFAULT '' NOT NULL,
	"working_hours_note" text DEFAULT '' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "host_legal_profiles" ADD CONSTRAINT "host_legal_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
