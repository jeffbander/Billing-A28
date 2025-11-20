CREATE TABLE `valuation_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`valuationId` int NOT NULL,
	`cptCodeId` int NOT NULL,
	`monthlyOrders` int DEFAULT 0,
	`monthlyReads` int DEFAULT 0,
	`monthlyPerforms` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `valuation_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `valuations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`providerId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`monthlyPatients` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `valuations_id` PRIMARY KEY(`id`)
);
