import { z } from "zod";

// Shared Zod schemas for validation at system boundaries (API inputs, form data)

export const moneySchema = z
  .number()
  .int("Must be integer centimes")
  .nonnegative("Money cannot be negative");

export const organizationIdSchema = z.string().uuid();
export const userIdSchema = z.string().uuid();

export const roleSchema = z.enum(["owner", "manager", "accountant", "driver"]);

export const vehicleStatusSchema = z.enum([
  "available",
  "on_mission",
  "maintenance",
  "out_of_service",
]);

export const vehicleTypeSchema = z.enum(["truck", "van", "trailer", "other"]);

export const createVehicleSchema = z.object({
  code: z.string().min(1).max(50),
  registration: z.string().min(1).max(50),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  type: vehicleTypeSchema.optional(),
  capacityKg: z.number().positive().optional(),
  baselineConsumption: z.number().positive().optional(),
});

export const missionStatusSchema = z.enum([
  "planned",
  "in_progress",
  "completed",
  "invoiced",
  "cancelled",
]);

export const createMissionSchema = z.object({
  clientId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  originCity: z.string().min(1).max(200),
  destinationCity: z.string().min(1).max(200),
  cargo: z.string().max(500).optional(),
  agreedPrice: moneySchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export const createFuelLogSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  missionId: z.string().uuid().optional(),
  litres: z.number().positive(),
  pricePerLitre: moneySchema,
  total: moneySchema,
  odometer: z.number().int().nonnegative().optional(),
  station: z.string().max(200).optional(),
  filledAt: z.coerce.date(),
  source: z.enum(["driver_app", "desktop", "ocr"]),
});

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  ice: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
});

export const invoiceLineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: moneySchema,
  amount: moneySchema,
});

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  missionId: z.string().uuid().optional(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  lines: z.array(invoiceLineSchema).min(1),
  vatRate: z.number().min(0).max(1),
});

export const createEmployeeSchema = z.object({
  fullName: z.string().min(1).max(200),
  role: z.string().min(1).max(100),
  baseSalary: moneySchema,
  contractType: z.enum(["cdi", "cdd", "interim"]).optional(),
  contractEndsAt: z.coerce.date().optional(),
  cnssNumber: z.string().max(50).optional(),
});

export const signupSchema = z.object({
  orgName: z.string().min(2).max(200),
  ownerName: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
