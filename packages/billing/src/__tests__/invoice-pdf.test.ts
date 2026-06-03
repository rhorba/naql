import type { Money } from "@naql/core";
import { describe, expect, it } from "vitest";
import { generateInvoiceHtml } from "../invoice-pdf";

const BASE: Parameters<typeof generateInvoiceHtml>[0] = {
  locale: "fr",
  number: "INV-2026-0001",
  issueDate: new Date("2026-06-01"),
  dueDate: new Date("2026-07-01"),
  issuer: { name: "Transport Demo SARL", ice: "000012345" },
  client: { name: "Maroc Ciment SA", ice: "001234567" },
  lines: [
    {
      description: "Transport Casablanca → Marrakech",
      quantity: 1,
      unitPrice: 800_000 as Money,
      amount: 800_000 as Money,
    },
  ],
  subtotal: 800_000 as Money,
  vatRate: 20,
  vatAmount: 160_000 as Money,
  total: 960_000 as Money,
};

describe("generateInvoiceHtml — FR", () => {
  it("returns a complete HTML document", () => {
    const html = generateInvoiceHtml(BASE);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes invoice number", () => {
    const html = generateInvoiceHtml(BASE);
    expect(html).toContain("INV-2026-0001");
  });

  it("includes issuer name and ICE", () => {
    const html = generateInvoiceHtml(BASE);
    expect(html).toContain("Transport Demo SARL");
    expect(html).toContain("000012345");
  });

  it("includes client name and ICE", () => {
    const html = generateInvoiceHtml(BASE);
    expect(html).toContain("Maroc Ciment SA");
    expect(html).toContain("001234567");
  });

  it("includes line item description", () => {
    const html = generateInvoiceHtml(BASE);
    expect(html).toContain("Transport Casablanca");
  });

  it("includes VAT rate", () => {
    const html = generateInvoiceHtml(BASE);
    expect(html).toContain("20%");
  });

  it("sets dir=ltr for French locale", () => {
    const html = generateInvoiceHtml(BASE);
    expect(html).toContain('dir="ltr"');
    expect(html).toContain('lang="fr"');
  });

  it("includes issue and due dates", () => {
    const html = generateInvoiceHtml(BASE);
    expect(html).toContain("2026");
  });

  it("uses Naql branding", () => {
    const html = generateInvoiceHtml(BASE);
    expect(html).toContain("Naql");
  });
});

describe("generateInvoiceHtml — AR (RTL)", () => {
  it("sets dir=rtl for Arabic locale", () => {
    const html = generateInvoiceHtml({ ...BASE, locale: "ar" });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar"');
  });

  it("uses Arabic label for invoice", () => {
    const html = generateInvoiceHtml({ ...BASE, locale: "ar" });
    expect(html).toContain("فاتورة");
  });

  it("uses Arabic label for total", () => {
    const html = generateInvoiceHtml({ ...BASE, locale: "ar" });
    expect(html).toContain("المجموع");
  });

  it("includes Noto Kufi Arabic font", () => {
    const html = generateInvoiceHtml({ ...BASE, locale: "ar" });
    expect(html).toContain("Noto Kufi Arabic");
  });
});

describe("generateInvoiceHtml — edge cases", () => {
  it("works without optional dueDate", () => {
    const { dueDate: _omit, ...baseNoDueDate } = BASE;
    const html = generateInvoiceHtml(baseNoDueDate);
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("works without ICE numbers", () => {
    const html = generateInvoiceHtml({
      ...BASE,
      issuer: { name: "Test Corp" },
      client: { name: "Client Inc" },
    });
    expect(html).toContain("Test Corp");
    expect(html).not.toContain("ICE: undefined");
  });

  it("handles multiple line items", () => {
    const html = generateInvoiceHtml({
      ...BASE,
      lines: [
        {
          description: "Trip A",
          quantity: 2,
          unitPrice: 300_000 as Money,
          amount: 600_000 as Money,
        },
        {
          description: "Trip B",
          quantity: 1,
          unitPrice: 200_000 as Money,
          amount: 200_000 as Money,
        },
      ],
    });
    expect(html).toContain("Trip A");
    expect(html).toContain("Trip B");
  });
});
