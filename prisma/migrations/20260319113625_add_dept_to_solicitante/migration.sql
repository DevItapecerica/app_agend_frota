-- AlterTable
ALTER TABLE `Solicitante` ADD COLUMN `departamentoId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Solicitante` ADD CONSTRAINT `Solicitante_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `Departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
