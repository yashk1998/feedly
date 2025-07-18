-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NULL,
    `tz` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `plan` ENUM('free', 'pro', 'power') NOT NULL DEFAULT 'free',
    `slack_webhook_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `team_id` BIGINT NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',

    PRIMARY KEY (`team_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feed` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(2048) NOT NULL,
    `title` VARCHAR(255) NULL,
    `site_url` VARCHAR(2048) NULL,
    `last_fetched_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Feed_url_key`(`url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `team_id` BIGINT NULL,
    `user_id` VARCHAR(191) NULL,
    `feed_id` BIGINT NOT NULL,
    `category` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Article` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `feed_id` BIGINT NOT NULL,
    `guid` VARCHAR(765) NOT NULL,
    `title` LONGTEXT NULL,
    `url` LONGTEXT NULL,
    `published_at` DATETIME(3) NULL,
    `author` VARCHAR(255) NULL,
    `summary_html` MEDIUMTEXT NULL,
    `content_html` LONGTEXT NULL,
    `checksum` CHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Article_checksum_idx`(`checksum`),
    INDEX `Article_published_at_idx`(`published_at`),
    UNIQUE INDEX `Article_feed_id_guid_key`(`feed_id`, `guid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArticleRead` (
    `article_id` BIGINT NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`article_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiCredits` (
    `user_id` VARCHAR(191) NOT NULL,
    `cycle_start` DATETIME(3) NOT NULL,
    `cycle_end` DATETIME(3) NOT NULL,
    `used` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`user_id`, `cycle_start`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialToken` (
    `user_id` VARCHAR(191) NOT NULL,
    `network` ENUM('twitter', 'linkedin', 'reddit') NOT NULL,
    `accessToken` LONGTEXT NOT NULL,
    `refreshToken` LONGTEXT NULL,
    `expiresAt` DATETIME(3) NULL,

    PRIMARY KEY (`user_id`, `network`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `razorpay_subscription_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plan` ENUM('free', 'pro', 'power') NOT NULL,
    `status` ENUM('active', 'canceled', 'past_due', 'trial') NOT NULL,
    `current_period_start` DATETIME(3) NULL,
    `current_period_end` DATETIME(3) NULL,

    PRIMARY KEY (`razorpay_subscription_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminLog` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(255) NOT NULL,
    `details` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_feed_id_fkey` FOREIGN KEY (`feed_id`) REFERENCES `Feed`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_feed_id_fkey` FOREIGN KEY (`feed_id`) REFERENCES `Feed`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArticleRead` ADD CONSTRAINT `ArticleRead_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `Article`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArticleRead` ADD CONSTRAINT `ArticleRead_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiCredits` ADD CONSTRAINT `AiCredits_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SocialToken` ADD CONSTRAINT `SocialToken_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
