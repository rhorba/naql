import type { Money } from "@naql/core";
import { toDirhams } from "@naql/core";

export interface InvoicePdfData {
  locale: "fr" | "ar";
  number: string;
  issueDate: Date;
  dueDate?: Date;
  issuer: {
    name: string;
    ice?: string;
    address?: string;
  };
  client: {
    name: string;
    ice?: string;
    address?: string;
  };
  lines: { description: string; quantity: number; unitPrice: Money; amount: Money }[];
  subtotal: Money;
  vatRate: number;
  vatAmount: Money;
  total: Money;
}

const LABELS = {
  fr: {
    invoice: "FACTURE",
    number: "N°",
    issueDate: "Date d'émission",
    dueDate: "Date d'échéance",
    issuer: "Émetteur",
    billTo: "Facturé à",
    description: "Désignation",
    qty: "Qté",
    unitPrice: "Prix unitaire HT",
    amount: "Montant HT",
    subtotal: "Sous-total HT",
    vat: "TVA",
    total: "Total TTC",
    ice: "ICE",
    currency: "MAD",
  },
  ar: {
    invoice: "فاتورة",
    number: "رقم",
    issueDate: "تاريخ الإصدار",
    dueDate: "تاريخ الاستحقاق",
    issuer: "المُصدِر",
    billTo: "الفوترة إلى",
    description: "البيان",
    qty: "الكمية",
    unitPrice: "سعر الوحدة",
    amount: "المبلغ",
    subtotal: "المجموع دون الضريبة",
    vat: "ضريبة القيمة المضافة",
    total: "المجموع شامل الضريبة",
    ice: "ICE",
    currency: "درهم",
  },
};

function fmt(centimes: Money, locale: "fr" | "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toDirhams(centimes));
}

function fmtDate(d: Date, locale: "fr" | "ar"): string {
  return d.toLocaleDateString(locale === "ar" ? "ar-MA" : "fr-MA");
}

/** Generate a self-contained HTML invoice (printable / saveable as PDF via browser). */
export function generateInvoiceHtml(data: InvoicePdfData): string {
  const L = LABELS[data.locale];
  const dir = data.locale === "ar" ? "rtl" : "ltr";
  const fontFamily =
    data.locale === "ar"
      ? '"Noto Kufi Arabic", "Segoe UI", sans-serif'
      : '"Plus Jakarta Sans", "Segoe UI", sans-serif';

  const lineRows = data.lines
    .map(
      (l) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">${l.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-variant-numeric:tabular-nums">${l.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:end;font-variant-numeric:tabular-nums">${fmt(l.unitPrice, data.locale)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:end;font-variant-numeric:tabular-nums;font-weight:600">${fmt(l.amount, data.locale)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${data.locale}" dir="${dir}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${L.invoice} ${data.number}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Noto+Kufi+Arabic:wght@400;600&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${fontFamily};font-size:14px;color:#1e293b;background:#fff;padding:40px}
@media print{body{padding:0}@page{margin:20mm}}
</style>
</head>
<body>
<div style="max-width:800px;margin:0 auto">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:36px;height:36px;border-radius:8px;background:#f59e0b;display:flex;align-items:center;justify-content:center">
          <span style="font-weight:700;font-size:18px;color:#0f172a">N</span>
        </div>
        <span style="font-size:22px;font-weight:700;color:#0f172a">Naql</span>
      </div>
      <p style="color:#64748b;font-size:12px">نقل · Transport Management</p>
    </div>
    <div style="text-align:end">
      <h1 style="font-size:28px;font-weight:700;color:#0f172a;letter-spacing:-0.5px">${L.invoice}</h1>
      <p style="color:#64748b;margin-top:4px">${L.number} <strong style="color:#0f172a">${data.number}</strong></p>
      <p style="color:#64748b;font-size:12px;margin-top:4px">${L.issueDate}: ${fmtDate(data.issueDate, data.locale)}</p>
      ${data.dueDate ? `<p style="color:#64748b;font-size:12px">${L.dueDate}: ${fmtDate(data.dueDate, data.locale)}</p>` : ""}
    </div>
  </div>

  <!-- Parties -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:36px">
    <div style="background:#f8fafc;border-radius:8px;padding:16px">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:8px">${L.issuer}</p>
      <p style="font-weight:600;color:#0f172a">${data.issuer.name}</p>
      ${data.issuer.ice ? `<p style="color:#475569;font-size:12px;margin-top:4px">${L.ice}: ${data.issuer.ice}</p>` : ""}
      ${data.issuer.address ? `<p style="color:#475569;font-size:12px;margin-top:4px">${data.issuer.address}</p>` : ""}
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:16px">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:8px">${L.billTo}</p>
      <p style="font-weight:600;color:#0f172a">${data.client.name}</p>
      ${data.client.ice ? `<p style="color:#475569;font-size:12px;margin-top:4px">${L.ice}: ${data.client.ice}</p>` : ""}
    </div>
  </div>

  <!-- Line items -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#0f172a;color:#fff">
        <th style="padding:10px 12px;text-align:start;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">${L.description}</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">${L.qty}</th>
        <th style="padding:10px 12px;text-align:end;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">${L.unitPrice}</th>
        <th style="padding:10px 12px;text-align:end;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">${L.amount}</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:40px">
    <div style="min-width:280px">
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0">
        <span style="color:#64748b">${L.subtotal}</span>
        <span style="font-variant-numeric:tabular-nums">${fmt(data.subtotal, data.locale)} ${L.currency}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0">
        <span style="color:#64748b">${L.vat} (${data.vatRate}%)</span>
        <span style="font-variant-numeric:tabular-nums">${fmt(data.vatAmount, data.locale)} ${L.currency}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;background:#0f172a;border-radius:8px;padding:12px 16px;margin-top:8px">
        <span style="font-weight:700;color:#fff">${L.total}</span>
        <span style="font-weight:700;font-size:18px;color:#f59e0b;font-variant-numeric:tabular-nums">${fmt(data.total, data.locale)} ${L.currency}</span>
      </div>
    </div>
  </div>

  <div style="border-top:1px solid #e2e8f0;padding-top:16px;text-align:center;color:#94a3b8;font-size:11px">
    Généré par Naql · naql.ma
  </div>
</div>
</body>
</html>`;
}
