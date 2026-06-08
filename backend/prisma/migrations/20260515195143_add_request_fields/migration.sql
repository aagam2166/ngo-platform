/*
  Warnings:

  - You are about to drop the column `reviewdAt` on the `request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Request` DROP COLUMN `reviewdAt`,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL;
