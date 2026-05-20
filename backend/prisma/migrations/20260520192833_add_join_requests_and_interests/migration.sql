-- CreateTable
CREATE TABLE `VolunteerJoinRequest` (
    `id` VARCHAR(191) NOT NULL,
    `volunteerId` VARCHAR(191) NOT NULL,
    `ngoId` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VolunteerJoinRequest_volunteerId_idx`(`volunteerId`),
    INDEX `VolunteerJoinRequest_ngoId_idx`(`ngoId`),
    INDEX `VolunteerJoinRequest_status_idx`(`status`),
    UNIQUE INDEX `VolunteerJoinRequest_volunteerId_ngoId_key`(`volunteerId`, `ngoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VolunteerInterest` (
    `id` VARCHAR(191) NOT NULL,
    `volunteerId` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `ngoId` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VolunteerInterest_volunteerId_idx`(`volunteerId`),
    INDEX `VolunteerInterest_requestId_idx`(`requestId`),
    INDEX `VolunteerInterest_ngoId_idx`(`ngoId`),
    INDEX `VolunteerInterest_status_idx`(`status`),
    UNIQUE INDEX `VolunteerInterest_volunteerId_requestId_key`(`volunteerId`, `requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VolunteerJoinRequest` ADD CONSTRAINT `VolunteerJoinRequest_volunteerId_fkey` FOREIGN KEY (`volunteerId`) REFERENCES `Volunteer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VolunteerJoinRequest` ADD CONSTRAINT `VolunteerJoinRequest_ngoId_fkey` FOREIGN KEY (`ngoId`) REFERENCES `NGO`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VolunteerInterest` ADD CONSTRAINT `VolunteerInterest_volunteerId_fkey` FOREIGN KEY (`volunteerId`) REFERENCES `Volunteer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VolunteerInterest` ADD CONSTRAINT `VolunteerInterest_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `Request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VolunteerInterest` ADD CONSTRAINT `VolunteerInterest_ngoId_fkey` FOREIGN KEY (`ngoId`) REFERENCES `NGO`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
