CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barcode` text,
	`name` text NOT NULL,
	`dosage` text,
	`description` text,
	`usage` text,
	`expiry_date` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`photo_url` text,
	`photo_public_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `items_barcode_unique` ON `items` (`barcode`);--> statement-breakpoint
CREATE INDEX `items_expiry_idx` ON `items` (`expiry_date`);