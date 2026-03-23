/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Agendamento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Agendamento` DROP COLUMN `createdAt`,
    MODIFY `itinerario` VARCHAR(191) NOT NULL,
    MODIFY `observacao` VARCHAR(191) NULL;
