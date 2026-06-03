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
