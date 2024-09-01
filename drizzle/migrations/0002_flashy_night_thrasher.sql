CREATE TABLE `account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`salary` text NOT NULL,
	`level` text NOT NULL,
	`exp` text NOT NULL,
	`quantity` text NOT NULL,
	`form` text NOT NULL,
	`address` text NOT NULL,
	`companyid` integer NOT NULL,
	`description` text NOT NULL,
	FOREIGN KEY (`companyid`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE no action
);
