-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'Bs',
ADD COLUMN     "isSpecialOrder" BOOLEAN NOT NULL DEFAULT false;
