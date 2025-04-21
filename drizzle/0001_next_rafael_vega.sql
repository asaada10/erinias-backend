ALTER TABLE "domain_member" RENAME COLUMN "guild_id" TO "domain_id";--> statement-breakpoint
ALTER TABLE "permissions" RENAME COLUMN "guild_id" TO "domain_id";--> statement-breakpoint
ALTER TABLE "permissions" RENAME COLUMN "guild_member_id" TO "domain_member_id";--> statement-breakpoint
ALTER TABLE "room" RENAME COLUMN "guild_id" TO "domain_id";--> statement-breakpoint
ALTER TABLE "domain_member" DROP CONSTRAINT "domain_member_guild_id_domain_id_fk";
--> statement-breakpoint
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_guild_id_domain_id_fk";
--> statement-breakpoint
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_guild_member_id_domain_member_id_fk";
--> statement-breakpoint
ALTER TABLE "room" DROP CONSTRAINT "room_guild_id_domain_id_fk";
--> statement-breakpoint
ALTER TABLE "domain" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "domain_member" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "message_read" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "domain_member" ADD CONSTRAINT "domain_member_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_domain_member_id_domain_member_id_fk" FOREIGN KEY ("domain_member_id") REFERENCES "public"."domain_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE cascade ON UPDATE no action;