ALTER TABLE `rates` ADD `payerType` enum('Medicare','Commercial','Medicaid') NOT NULL;--> statement-breakpoint
ALTER TABLE `rates` DROP COLUMN `payerId`;--> statement-breakpoint
ALTER TABLE `rates` DROP COLUMN `planId`;--> statement-breakpoint
ALTER TABLE `rates` DROP COLUMN `medicareBase`;