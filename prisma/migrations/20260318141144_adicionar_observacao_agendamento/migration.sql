-- AlterTable
ALTER TABLE `Agendamento` ADD COLUMN `observacao` TEXT NULL;

-- AlterTable
ALTER TABLE `Condutor` MODIFY `validadeCnh` DATETIME(3) NULL,
    MODIFY `telefone` VARCHAR(191) NULL;
