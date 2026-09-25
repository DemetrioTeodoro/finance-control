-- AlterTable: guarda o FITID do OFX para deduplicar imports com períodos
-- sobrepostos. Nulo em transações manuais e nas já importadas antes desta
-- mudança (NULLs não conflitam entre si nos índices únicos abaixo).
ALTER TABLE "Transaction" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_accountId_externalId_key" ON "Transaction"("accountId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_creditCardId_externalId_key" ON "Transaction"("creditCardId", "externalId");
