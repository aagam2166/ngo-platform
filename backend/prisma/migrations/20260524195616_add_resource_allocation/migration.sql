-- CreateTable
CREATE TABLE `ResourceAllocation` (
    `id` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `ngoId` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `notes` TEXT NULL,
    `allocatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `allocatedBy` VARCHAR(191) NOT NULL,

    INDEX `ResourceAllocation_resourceId_idx`(`resourceId`),
    INDEX `ResourceAllocation_requestId_idx`(`requestId`),
    INDEX `ResourceAllocation_ngoId_idx`(`ngoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ResourceAllocation` ADD CONSTRAINT `ResourceAllocation_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResourceAllocation` ADD CONSTRAINT `ResourceAllocation_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `Request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResourceAllocation` ADD CONSTRAINT `ResourceAllocation_ngoId_fkey` FOREIGN KEY (`ngoId`) REFERENCES `NGO`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
