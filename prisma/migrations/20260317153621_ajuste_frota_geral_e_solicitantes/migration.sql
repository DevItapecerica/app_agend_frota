/*
  Warnings:

  - Added the required column `solicitanteId` to the `Agendamento` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Agendamento` DROP FOREIGN KEY `Agendamento_departamentoId_fkey`;

-- DropForeignKey
ALTER TABLE `Veiculo` DROP FOREIGN KEY `Veiculo_secretariaId_fkey`;

-- DropIndex
DROP INDEX `Agendamento_departamentoId_fkey` ON `Agendamento`;

-- DropIndex
DROP INDEX `Veiculo_secretariaId_fkey` ON `Veiculo`;

-- AlterTable
ALTER TABLE `Agendamento` ADD COLUMN `solicitanteId` INTEGER NOT NULL,
    MODIFY `departamentoId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Veiculo` MODIFY `secretariaId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Solicitante` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `documento` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `secretariaId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Solicitante_documento_key`(`documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Veiculo` ADD CONSTRAINT `Veiculo_secretariaId_fkey` FOREIGN KEY (`secretariaId`) REFERENCES `Secretaria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Solicitante` ADD CONSTRAINT `Solicitante_secretariaId_fkey` FOREIGN KEY (`secretariaId`) REFERENCES `Secretaria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `Solicitante`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `Departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
