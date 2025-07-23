/*
  Warnings:

  - You are about to alter the column `total_days` on the `rents` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "rents" ALTER COLUMN "total_days" SET DATA TYPE DECIMAL(10,2);
