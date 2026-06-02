import { auth } from "@/auth";
import { generateInvoiceHtml } from "@naql/billing";
import type { Money } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { clients, invoices, organizations } from "@naql/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orgId = session.user.organizationId;
  const locale = (new URL(request.url).searchParams.get("locale") ?? "fr") as "fr" | "ar";

  const [invoice, client, org] = await withOrgContext(db, orgId, async (tx) => {
    const [inv] = await tx
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, orgId)));
    if (!inv) return [null, null, null] as const;
    const [c] = await tx.select().from(clients).where(eq(clients.id, inv.clientId));
    const [o] = await tx.select().from(organizations).where(eq(organizations.id, orgId));
    return [inv, c, o] as const;
  });

  if (!invoice || !client || !org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const lines = (
    invoice.lines as { description: string; quantity: number; unitPrice: number; amount: number }[]
  ).map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice as Money,
    amount: l.amount as Money,
  }));

  const html = generateInvoiceHtml({
    locale,
    number: invoice.number,
    issueDate: new Date(invoice.issueDate),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
    issuer: { name: org.name, ice: org.ice ?? undefined },
    client: { name: client.name, ice: client.ice ?? undefined },
    lines,
    subtotal: invoice.subtotal as Money,
    vatRate: Math.round(invoice.vatRate * 100),
    vatAmount: invoice.vatAmount as Money,
    total: invoice.total as Money,
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${invoice.number}.html"`,
    },
  });
}
