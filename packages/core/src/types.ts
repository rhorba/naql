// Branded integer centimes — never a float. 1 MAD = 100 centimes.
export type Money = number & { readonly __brand: "Money" };

export type Role = "owner" | "manager" | "accountant" | "driver";

export type OrgPlan = "trial" | "pro" | "enterprise";

export type Organization = {
  id: string;
  name: string;
  ice?: string;
  currency: "MAD";
  locale: "fr" | "ar" | "en";
  plan: OrgPlan;
  createdAt: Date;
};

export type User = {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
};

export type VehicleStatus = "available" | "on_mission" | "maintenance" | "out_of_service";
export type VehicleType = "truck" | "van" | "trailer" | "other";

export type Vehicle = {
  id: string;
  organizationId: string;
  code: string;
  registration: string;
  make?: string;
  model?: string;
  year?: number;
  type?: VehicleType;
  capacityKg?: number;
  baselineConsumption?: number;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type VehicleDocumentKind = "insurance" | "technical_inspection" | "license" | "other";

export type VehicleDocument = {
  id: string;
  organizationId: string;
  vehicleId: string;
  kind: VehicleDocumentKind;
  reference?: string;
  issuedAt?: Date;
  expiresAt: Date;
  fileUrl?: string;
};

export type Driver = {
  id: string;
  organizationId: string;
  userId?: string;
  employeeId: string;
  licenseNumber?: string;
  licenseExpiresAt?: Date;
};

export type MissionStatus = "planned" | "in_progress" | "completed" | "invoiced" | "cancelled";

export type Mission = {
  id: string;
  organizationId: string;
  clientId: string;
  vehicleId?: string;
  driverId?: string;
  originCity: string;
  destinationCity: string;
  cargo?: string;
  agreedPrice: Money;
  status: MissionStatus;
  startDate: Date;
  endDate?: Date;
  proofOfDeliveryUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FuelSource = "driver_app" | "desktop" | "ocr";

export type FuelLog = {
  id: string;
  organizationId: string;
  vehicleId: string;
  driverId?: string;
  missionId?: string;
  litres: number;
  pricePerLitre: Money;
  total: Money;
  odometer?: number;
  station?: string;
  filledAt: Date;
  receiptUrl?: string;
  ocrConfidence?: number;
  source: FuelSource;
};

export type Client = {
  id: string;
  organizationId: string;
  name: string;
  ice?: string;
  contactEmail?: string;
  contactPhone?: string;
  outstandingBalance: Money;
};

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled";

export type InvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: Money;
  amount: Money;
};

export type Invoice = {
  id: string;
  organizationId: string;
  clientId: string;
  number: string;
  issueDate: Date;
  dueDate?: Date;
  lines: InvoiceLine[];
  subtotal: Money;
  vatRate: number;
  vatAmount: Money;
  total: Money;
  status: InvoiceStatus;
};

export type PaymentMethod = "cash" | "bank" | "cheque" | "other";

export type Payment = {
  id: string;
  organizationId: string;
  invoiceId?: string;
  amount: Money;
  method: PaymentMethod;
  paidAt: Date;
};

export type ExpenseCategory = "fuel" | "maintenance" | "tolls" | "salary" | "admin" | "other";

export type Expense = {
  id: string;
  organizationId: string;
  vehicleId?: string;
  category: ExpenseCategory;
  amount: Money;
  spentAt: Date;
  receiptUrl?: string;
  source: "manual" | "ocr";
};

export type ContractType = "cdi" | "cdd" | "interim";

export type Employee = {
  id: string;
  organizationId: string;
  userId?: string;
  fullName: string;
  role: string;
  baseSalary: Money;
  contractType?: ContractType;
  contractEndsAt?: Date;
  cnssNumber?: string;
};

export type AttendanceStatus = "present" | "absent" | "leave";

export type Attendance = {
  id: string;
  organizationId: string;
  employeeId: string;
  date: Date;
  status: AttendanceStatus;
  hours?: number;
};

export type Advance = {
  id: string;
  organizationId: string;
  employeeId: string;
  amount: Money;
  grantedAt: Date;
  repaid: boolean;
};

export type AuditAction = "create" | "update" | "delete" | "approve";

export type AuditLog = {
  id: string;
  organizationId: string;
  actorUserId: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
  at: Date;
};

// Session shape carried in Auth.js JWT/session
export type SessionUser = {
  userId: string;
  organizationId: string;
  role: Role;
  name: string;
  email: string;
};
