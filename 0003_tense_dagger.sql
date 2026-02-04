CREATE TABLE `contentFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` enum('post','comment','message') NOT NULL,
	`contentId` int NOT NULL,
	`userId` int NOT NULL,
	`flagType` enum('profanity','hate_speech','violence','spam','adult_content','self_harm','misinformation') NOT NULL,
	`confidence` int DEFAULT 0,
	`autoAction` enum('none','hidden','removed') DEFAULT 'none',
	`reviewedBy` int,
	`reviewStatus` enum('pending','confirmed','false_positive') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentFlags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`contentType` enum('post','comment','message','user','group') NOT NULL,
	`contentId` int NOT NULL,
	`reportedUserId` int NOT NULL,
	`reason` enum('spam','harassment','hate_speech','violence','nudity','misinformation','copyright','other') NOT NULL,
	`description` text,
	`status` enum('pending','reviewing','resolved','dismissed') DEFAULT 'pending',
	`moderatorId` int,
	`moderatorNotes` text,
	`resolution` enum('warning','content_removed','user_suspended','user_banned','no_action'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kindnessScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` int DEFAULT 100,
	`positiveActions` int DEFAULT 0,
	`negativeActions` int DEFAULT 0,
	`reportsReceived` int DEFAULT 0,
	`reportsConfirmed` int DEFAULT 0,
	`helpfulFlags` int DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kindnessScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `kindnessScores_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `moderationActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moderatorId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`actionType` enum('warning','content_removed','muted','suspended','banned','unbanned','appeal_approved','appeal_denied') NOT NULL,
	`reason` text NOT NULL,
	`contentType` enum('post','comment','message','user','group'),
	`contentId` int,
	`duration` int,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderationActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`activeUsers` int DEFAULT 0,
	`newUsers` int DEFAULT 0,
	`totalPosts` int DEFAULT 0,
	`totalComments` int DEFAULT 0,
	`totalMessages` int DEFAULT 0,
	`totalReports` int DEFAULT 0,
	`resolvedReports` int DEFAULT 0,
	`avgSessionDuration` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platformAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAppeals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moderationActionId` int NOT NULL,
	`appealText` text NOT NULL,
	`status` enum('pending','reviewing','approved','denied') DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userAppeals_id` PRIMARY KEY(`id`)
);
