ALTER TABLE "reviews" ADD COLUMN "rating_cleanliness" smallint;
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "rating_check_in" smallint;
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "rating_location" smallint;
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "rating_photo_match" smallint;
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "rating_value" smallint;
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "rating_service" smallint;
--> statement-breakpoint
UPDATE "reviews"
SET
  "rating_cleanliness" = LEAST(10, "rating" * 2),
  "rating_check_in" = LEAST(10, "rating" * 2),
  "rating_location" = LEAST(10, "rating" * 2),
  "rating_photo_match" = LEAST(10, "rating" * 2),
  "rating_value" = LEAST(10, "rating" * 2),
  "rating_service" = LEAST(10, "rating" * 2),
  "rating" = LEAST(10, "rating" * 2);
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "rating_cleanliness" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "rating_check_in" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "rating_location" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "rating_photo_match" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "rating_value" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "rating_service" SET NOT NULL;
