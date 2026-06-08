-- AlterTable
ALTER TABLE `Request` ADD COLUMN `rejectionReason` TEXT NULL,
    ADD COLUMN `reviewdAt` DATETIME(3) NULL;
