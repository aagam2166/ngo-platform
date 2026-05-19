/*
  Warnings:

  - Added the required column `ngoId` to the `VolunteerAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `volunteerassignment` ADD COLUMN `ngoId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `NGOVolunteer` (
    `id` VARCHAR(191) NOT NULL,
    `ngoId` VARCHAR(191) NOT NULL,
    `volunteerId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `NGOVolunteer_ngoId_idx`(`ngoId`),
    INDEX `NGOVolunteer_volunteerId_idx`(`volunteerId`),
    UNIQUE INDEX `NGOVolunteer_ngoId_volunteerId_key`(`ngoId`, `volunteerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `VolunteerAssignment_ngoId_idx` ON `VolunteerAssignment`(`ngoId`);

-- AddForeignKey
ALTER TABLE `VolunteerAssignment` ADD CONSTRAINT `VolunteerAssignment_ngoId_fkey` FOREIGN KEY (`ngoId`) REFERENCES `NGO`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NGOVolunteer` ADD CONSTRAINT `NGOVolunteer_ngoId_fkey` FOREIGN KEY (`ngoId`) REFERENCES `NGO`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NGOVolunteer` ADD CONSTRAINT `NGOVolunteer_volunteerId_fkey` FOREIGN KEY (`volunteerId`) REFERENCES `Volunteer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
