"use client";

import { Printer } from "lucide-react";

export function PrintBudget() {
  return (
    <button type="button" onClick={() => window.print()} className="site-button site-primary print:hidden">
      <Printer size={17} aria-hidden /> Imprimir ou salvar PDF
    </button>
  );
}
