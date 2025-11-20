CREATE TABLE `institutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`shortName` varchar(50),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institutions_id` PRIMARY KEY(`id`),
	CONSTRAINT `institutions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`providerType` enum('Type1','Type2','Type3') NOT NULL,
	`homeInstitutionId` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenario_provider_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`providerId` int NOT NULL,
	`cptCodeId` int NOT NULL,
	`monthlyOrdered` int DEFAULT 0,
	`monthlyRead` int DEFAULT 0,
	`monthlyPerformed` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenario_provider_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cpt_codes` ADD `workRvu` decimal(6,2);--> statement-breakpoint
ALTER TABLE `cpt_codes` ADD `procedureType` enum('imaging','procedure','visit') DEFAULT 'procedure';