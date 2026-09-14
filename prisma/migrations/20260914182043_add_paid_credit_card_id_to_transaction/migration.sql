-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "paidCreditCardId" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paidCreditCardId_fkey" FOREIGN KEY ("paidCreditCardId") REFERENCES "CreditCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
