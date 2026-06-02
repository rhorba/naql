export type AlertKind =
  | "document_expiry"
  | "contract_renewal"
  | "invoice_overdue"
  | "over_consumption";

export interface Alert {
  kind: AlertKind;
  organizationId: string;
  entityId: string;
  message: string;
  severity: "info" | "warning" | "critical";
  at: Date;
}

/** Stub — real sweep registered as pg-boss job in Sprint 3 */
export async function runAlertSweep(_organizationId: string): Promise<Alert[]> {
  return [];
}
