"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ReportExportButtonProps = {
  period: string;
  startDate: string;
  endDate: string;
};

const FORMATS = [
  { value: "csv", label: "CSV", icon: FileText },
  { value: "xlsx", label: "Excel (XLSX)", icon: FileSpreadsheet },
  { value: "pdf", label: "PDF", icon: FileText },
] as const;

export function ReportExportButton({
  period,
  startDate,
  endDate,
}: ReportExportButtonProps) {
  function exportHref(format: string) {
    const params = new URLSearchParams({ format, period, startDate, endDate });

    return `/api/relatorios/export?${params.toString()}`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        }
      />

      <DropdownMenuContent align="end">
        {FORMATS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            render={<a href={exportHref(value)} />}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
