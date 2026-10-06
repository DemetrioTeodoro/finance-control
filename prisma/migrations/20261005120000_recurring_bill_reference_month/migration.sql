-- AlterTable: guarda o mês a que o pagamento da conta fixa se refere, em vez
-- de deduzir pela data da transação (a cobrança pode cair no mês seguinte).
ALTER TABLE "Transaction" ADD COLUMN "paidRecurringBillYear" INTEGER,
ADD COLUMN "paidRecurringBillMonth" INTEGER;

-- Vínculos existentes passam a se referir ao mês da própria data da
-- transação, que é como já eram exibidos — nenhuma mudança visível.
UPDATE "Transaction"
SET "paidRecurringBillYear" = EXTRACT(YEAR FROM "date")::INTEGER,
    "paidRecurringBillMonth" = EXTRACT(MONTH FROM "date")::INTEGER - 1
WHERE "paidRecurringBillId" IS NOT NULL;
