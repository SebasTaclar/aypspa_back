-- AlterTable
ALTER TABLE "rents" ADD COLUMN     "observations" TEXT,
ADD COLUMN     "total_days" INTEGER,
ADD COLUMN     "total_price" DECIMAL(10,2);
