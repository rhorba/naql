"use client";

import { sendInvoice } from "@/app/actions/invoicing";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

interface Props {
  invoiceId: string;
  status: string;
  locale: "fr" | "ar";
}

export function InvoiceActions({ invoiceId, status, locale }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    setBusy(true);
    try {
      await sendInvoice({ id: invoiceId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* PDF download — opens the HTML invoice in a new tab */}
      <a
        href={`/api/invoices/${invoiceId}/pdf?locale=${locale}`}
        target="_blank"
        rel="noreferrer"
        className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition"
      >
        Télécharger PDF
      </a>

      {status === "draft" && (
        <button
          type="button"
          disabled={busy}
          onClick={handleSend}
          className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 disabled:opacity-60 transition"
        >
          {busy ? "Envoi…" : "Marquer comme envoyée"}
        </button>
      )}

      <button
        type="button"
        onClick={() => router.push("/invoicing")}
        className="text-sm text-slate-400 hover:text-slate-700 transition"
      >
        ← Retour
      </button>
    </div>
  );
}
