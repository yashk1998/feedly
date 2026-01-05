/*
  Warnings:

  - You are about to alter the column `guid` on the `Article` table. The data in that column could be lost. The data in that column will be cast from `VarChar(765)` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE `Article` MODIFY `guid` VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE `SavedArticle` (
    `article_id` BIGINT NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `saved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`article_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SavedArticle` ADD CONSTRAINT `SavedArticle_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `Article`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedArticle` ADD CONSTRAINT `SavedArticle_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
