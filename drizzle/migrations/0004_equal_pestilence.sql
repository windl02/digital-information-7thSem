CREATE TABLE `jobSeekers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fullName` text NOT NULL,
	`username` text NOT NULL,
	`dateOfBirth` text NOT NULL,
	`address` text NOT NULL,
	`phoneNumber` text NOT NULL,
	`email` text NOT NULL,
	`experience` text NOT NULL,
	`skills` text NOT NULL,
	`education` text NOT NULL,
	`avatarUrl` text NOT NULL,
	FOREIGN KEY (`username`) REFERENCES `account`(`username`) ON UPDATE no action ON DELETE no action
);
