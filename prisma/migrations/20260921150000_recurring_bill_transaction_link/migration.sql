-- AlterTable: liga a transação direto à conta fixa que ela paga (mesmo
-- padrão de Transaction.paidCreditCardId), em vez de casamento automático
-- por categoria.
ALTER TABLE "Transaction" ADD COLUMN "paidRecurringBillId" TEXT;

-- Migra confirmações que já tinham uma transação vinculada
-- (RecurringBillPayment.transactionId) para o novo vínculo direto na
-- transação, preservando o dado existente.
UPDATE "Transaction" t
SET "paidRecurringBillId" = rbp."recurringBillId"
FROM "RecurringBillPayment" rbp
WHERE rbp."transactionId" = t."id";

-- Remove as confirmações que só existiam para guardar esse vínculo — agora
-- representado em Transaction.paidRecurringBillId.
DELETE FROM "RecurringBillPayment" WHERE "transactionId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "RecurringBillPayment" DROP CONSTRAINT "RecurringBillPayment_transactionId_fkey";

-- AlterTable
ALTER TABLE "RecurringBillPayment" DROP COLUMN "transactionId";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paidRecurringBillId_fkey" FOREIGN KEY ("paidRecurringBillId") REFERENCES "RecurringBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
