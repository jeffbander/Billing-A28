CREATE TABLE `cpt_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cpt_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `cpt_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `payer_multipliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payerId` int,
	`payerType` enum('Medicare','Medicaid','Commercial'),
	`professionalMultiplier` int NOT NULL,
	`technicalMultiplier` int NOT NULL,
	`globalMultiplier` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payer_multipliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payerType` enum('Medicare','Medicaid','Commercial') NOT NULL,
	`payerName` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payerId` int NOT NULL,
	`planName` varchar(200) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cptCodeId` int NOT NULL,
	`payerId` int,
	`planId` int,
	`siteType` enum('FPA','Article28') NOT NULL,
	`component` enum('Professional','Technical','Global') NOT NULL,
	`rate` int NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`medicareBase` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenario_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`cptCodeId` int NOT NULL,
	`quantity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenario_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`providerName` varchar(200) NOT NULL,
	`totalPatients` int NOT NULL,
	`medicarePercent` int NOT NULL,
	`commercialPercent` int NOT NULL,
	`medicaidPercent` int NOT NULL,
	`siteType` enum('FPA','Article28') NOT NULL,
	`fpaTotal` int,
	`article28Total` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
