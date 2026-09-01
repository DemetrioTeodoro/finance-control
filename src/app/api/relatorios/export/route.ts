import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import {
  getExpensesByAccount,
  getExpensesByCategory,
  getExpensesByCreditCard,
  getReportSummary,
  resolveReportPeriod,
  resolveReportRange,
} from "@/services/report";

type ExpenseItem = {
  name: string;
  amount: number;
};

type ReportData = {
  periodLabel: string;
  summary: { income: number; expense: number; net: number };
  expensesByCategory: ExpenseItem[];
  expensesByAccount: ExpenseItem[];
  expensesByCreditCard: ExpenseItem[];
};

const longDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatAmount(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function escapeCsvField(value: string) {
  if (/[;"\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function buildCsv(data: ReportData) {
  function rows(items: ExpenseItem[]) {
    if (items.length === 0) {
      return ["Nenhum registro no período"];
    }

    return items.map(
      (item) => `${escapeCsvField(item.name)};${formatAmount(item.amount)}`,
    );
  }

  const lines = [
    "Relatório financeiro",
    `Período;${data.periodLabel}`,
    "",
    "Resumo",
    `Receitas;${formatAmount(data.summary.income)}`,
    `Despesas;${formatAmount(data.summary.expense)}`,
    `Saldo;${formatAmount(data.summary.net)}`,
    "",
    "Gastos por categoria",
    "Categoria;Valor",
    ...rows(data.expensesByCategory),
    "",
    "Gastos por conta",
    "Conta;Valor",
    ...rows(data.expensesByAccount),
    "",
    "Gastos por cartão",
    "Cartão;Valor",
    ...rows(data.expensesByCreditCard),
  ];

  return "﻿" + lines.join("\r\n");
}

async function buildXlsx(data: ReportData) {
  const workbook = new ExcelJS.Workbook();

  const resumo = workbook.addWorksheet("Resumo");
  resumo.columns = [{ width: 24 }, { width: 18 }];
  resumo.addRow(["Relatório financeiro"]);
  resumo.addRow(["Período", data.periodLabel]);
  resumo.addRow([]);
  resumo.addRow(["Receitas", data.summary.income]);
  resumo.addRow(["Despesas", data.summary.expense]);
  resumo.addRow(["Saldo", data.summary.net]);

  for (const row of [4, 5, 6]) {
    resumo.getCell(row, 2).numFmt = '"R$" #,##0.00';
  }

  function addBreakdownSheet(name: string, headerLabel: string, items: ExpenseItem[]) {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = [{ width: 28 }, { width: 18 }];
    sheet.addRow([headerLabel, "Valor"]).font = { bold: true };

    if (items.length === 0) {
      sheet.addRow(["Nenhum registro no período"]);
      return;
    }

    for (const item of items) {
      const row = sheet.addRow([item.name, item.amount]);
      row.getCell(2).numFmt = '"R$" #,##0.00';
    }
  }

  addBreakdownSheet("Por categoria", "Categoria", data.expensesByCategory);
  addBreakdownSheet("Por conta", "Conta", data.expensesByAccount);
  addBreakdownSheet("Por cartão", "Cartão", data.expensesByCreditCard);

  return workbook.xlsx.writeBuffer();
}

function buildPdf(data: ReportData) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    function row(label: string, value: string) {
      const y = doc.y;

      doc.fontSize(10).fillColor("#000").text(label, 50, y, { width: 300 });
      doc.fontSize(10).fillColor("#000").text(value, 350, y, {
        width: 195,
        align: "right",
      });
      doc.moveDown(0.4);
    }

    function section(title: string, items: ExpenseItem[]) {
      doc.moveDown(0.6);
      doc.fontSize(13).fillColor("#000").text(title, 50, doc.y);
      doc.moveDown(0.3);

      if (items.length === 0) {
        doc.fontSize(10).fillColor("#666").text("Nenhum registro no período");
        doc.fillColor("#000");
        return;
      }

      for (const item of items) {
        row(item.name, `R$ ${formatAmount(item.amount)}`);
      }
    }

    doc.fontSize(18).text("Relatório financeiro");
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor("#666").text(`Período: ${data.periodLabel}`);
    doc.fillColor("#000");
    doc.moveDown(0.8);

    doc.fontSize(13).text("Resumo", 50, doc.y);
    doc.moveDown(0.3);
    row("Receitas", `R$ ${formatAmount(data.summary.income)}`);
    row("Despesas", `R$ ${formatAmount(data.summary.expense)}`);
    row("Saldo", `R$ ${formatAmount(data.summary.net)}`);

    section("Gastos por categoria", data.expensesByCategory);
    section("Gastos por conta", data.expensesByAccount);
    section("Gastos por cartão", data.expensesByCreditCard);

    doc.end();
  });
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") ?? "csv";
  const period = resolveReportPeriod(searchParams.get("period") ?? undefined);
  const range = resolveReportRange(
    period,
    searchParams.get("startDate") ?? undefined,
    searchParams.get("endDate") ?? undefined,
  );

  const [summary, expensesByCategory, expensesByAccount, expensesByCreditCard] =
    await Promise.all([
      getReportSummary(session.user.id, range),
      getExpensesByCategory(session.user.id, range),
      getExpensesByAccount(session.user.id, range),
      getExpensesByCreditCard(session.user.id, range),
    ]);

  const data: ReportData = {
    periodLabel: `${longDate.format(range.startDate)} a ${longDate.format(range.endDate)}`,
    summary,
    expensesByCategory,
    expensesByAccount,
    expensesByCreditCard,
  };

  const fileSuffix = `${range.startDate.toISOString().split("T")[0]}_a_${
    range.endDate.toISOString().split("T")[0]
  }`;

  if (format === "xlsx") {
    const buffer = await buildXlsx(data);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="relatorio-${fileSuffix}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = await buildPdf(data);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${fileSuffix}.pdf"`,
      },
    });
  }

  const csv = buildCsv(data);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-${fileSuffix}.csv"`,
    },
  });
}
