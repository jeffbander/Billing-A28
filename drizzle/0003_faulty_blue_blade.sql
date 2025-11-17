CREATE TABLE `calculation_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commercialTechnicalMultiplier` int NOT NULL DEFAULT 150,
	`medicaidTechnicalMultiplier` int NOT NULL DEFAULT 80,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calculation_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `scenarios` ADD `rateMode` enum('manual','calculated') DEFAULT 'manual' NOT NULL;