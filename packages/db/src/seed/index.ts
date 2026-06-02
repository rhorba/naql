import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
/**
 * Idempotent demo seed — "Transport Demo SARL"
 * Mirrors the competitor demo (FUSO / MITSUBISHI fleet, 3 vehicles)
 * so a switcher immediately feels at home.
 *
 * Run: pnpm db:seed
 */
import postgres from "postgres";
import * as schema from "../schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL required");

const sql = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding demo org…");

  // ── Idempotency: skip if demo org already exists ──────────────────────────
  const [existing] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.name, "Transport Demo SARL"))
    .limit(1);

  if (existing) {
    console.log("✓ Demo org already exists — skipping.");
    await sql.end();
    return;
  }

  // ── Organization ──────────────────────────────────────────────────────────
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: "Transport Demo SARL",
      ice: "000012345",
      currency: "MAD",
      locale: "fr",
      plan: "trial",
    })
    .returning();

  const orgId = org?.id;
  console.log(`✓ Org: ${orgId}`);

  // ── Users (5) ─────────────────────────────────────────────────────────────
  const demoPassword = await argon2.hash("demo1234", { type: argon2.argon2id });

  const [_userJamal] = await db
    .insert(schema.users)
    .values({
      organizationId: orgId,
      email: "jamal@transport-demo.ma",
      name: "Jamal Benali",
      passwordHash: demoPassword,
      role: "owner",
    })
    .returning();

  const [_userYassine] = await db
    .insert(schema.users)
    .values({
      organizationId: orgId,
      email: "yassine@transport-demo.ma",
      name: "Yassine Tazi",
      passwordHash: demoPassword,
      role: "manager",
    })
    .returning();

  const [_userSalma] = await db
    .insert(schema.users)
    .values({
      organizationId: orgId,
      email: "salma@transport-demo.ma",
      name: "Salma Idrissi",
      passwordHash: demoPassword,
      role: "accountant",
    })
    .returning();

  const [userBrahim] = await db
    .insert(schema.users)
    .values({
      organizationId: orgId,
      email: "brahim@transport-demo.ma",
      name: "Brahim Ouali",
      passwordHash: demoPassword,
      role: "driver",
    })
    .returning();

  const [userKarim] = await db
    .insert(schema.users)
    .values({
      organizationId: orgId,
      email: "karim@transport-demo.ma",
      name: "Karim Alaoui",
      passwordHash: demoPassword,
      role: "driver",
    })
    .returning();

  console.log("✓ Users: 5");

  // ── Vehicles (3 — exactly the competitor demo fleet) ──────────────────────
  const soon = new Date();
  soon.setDate(soon.getDate() + 18); // expires in 18 days → triggers expiry alert

  const past = new Date();
  past.setMonth(past.getMonth() - 1); // expired last month

  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);

  const [v1] = await db
    .insert(schema.vehicles)
    .values({
      organizationId: orgId,
      code: "50387",
      registration: "50387-ا",
      make: "FUSO",
      model: "Fighter",
      year: 2019,
      type: "truck",
      capacityKg: 12000,
      baselineConsumption: 28,
      status: "available",
    })
    .returning();

  const [v2] = await db
    .insert(schema.vehicles)
    .values({
      organizationId: orgId,
      code: "73472",
      registration: "73472-ب",
      make: "MITSUBISHI",
      model: "Canter",
      year: 2021,
      type: "truck",
      capacityKg: 7000,
      baselineConsumption: 22,
      status: "on_mission",
    })
    .returning();

  const [v3] = await db
    .insert(schema.vehicles)
    .values({
      organizationId: orgId,
      code: "92272",
      registration: "92272-ج",
      make: "MITSUBISHI",
      model: "Fuso Rosa",
      year: 2020,
      type: "van",
      capacityKg: 3500,
      baselineConsumption: 18,
      status: "available",
    })
    .returning();

  console.log("✓ Vehicles: 3 (50387 FUSO, 73472 MITSUBISHI, 92272 MITSUBISHI)");

  // ── Vehicle Documents ──────────────────────────────────────────────────────
  // V1: insurance expiring soon (→ alert), visite OK
  await db.insert(schema.vehicleDocuments).values([
    {
      organizationId: orgId,
      vehicleId: v1?.id,
      kind: "insurance",
      reference: "ASS-2024-50387",
      issuedAt: past,
      expiresAt: soon, // EXPIRING SOON → triggers alert
    },
    {
      organizationId: orgId,
      vehicleId: v1?.id,
      kind: "technical_inspection",
      reference: "VT-2024-50387",
      issuedAt: past,
      expiresAt: future,
    },
    // V2: both docs OK
    {
      organizationId: orgId,
      vehicleId: v2?.id,
      kind: "insurance",
      reference: "ASS-2024-73472",
      issuedAt: past,
      expiresAt: future,
    },
    {
      organizationId: orgId,
      vehicleId: v2?.id,
      kind: "technical_inspection",
      reference: "VT-2024-73472",
      issuedAt: past,
      expiresAt: future,
    },
    // V3: visite expirée → critical alert
    {
      organizationId: orgId,
      vehicleId: v3?.id,
      kind: "insurance",
      reference: "ASS-2024-92272",
      issuedAt: past,
      expiresAt: future,
    },
    {
      organizationId: orgId,
      vehicleId: v3?.id,
      kind: "technical_inspection",
      reference: "VT-2023-92272",
      issuedAt: new Date(past.getTime() - 365 * 24 * 60 * 60 * 1000),
      expiresAt: past, // EXPIRED → triggers critical alert
    },
  ]);

  console.log("✓ Documents: 6");

  // ── Clients (4) ───────────────────────────────────────────────────────────
  const [clientA] = await db
    .insert(schema.clients)
    .values({
      organizationId: orgId,
      name: "Maroc Ciment SA",
      ice: "001234567",
      contactEmail: "transport@marocciment.ma",
      outstandingBalance: 0,
    })
    .returning();

  const [clientB] = await db
    .insert(schema.clients)
    .values({
      organizationId: orgId,
      name: "Cosumar Distribution",
      ice: "002345678",
      outstandingBalance: 1500000, // 15,000 MAD outstanding
    })
    .returning();

  const [clientC] = await db
    .insert(schema.clients)
    .values({
      organizationId: orgId,
      name: "OCP Logistique",
      ice: "003456789",
      outstandingBalance: 0,
    })
    .returning();

  const [clientD] = await db
    .insert(schema.clients)
    .values({
      organizationId: orgId,
      name: "Ynna Holding",
      outstandingBalance: 0,
    })
    .returning();

  console.log("✓ Clients: 4");

  // ── Missions (8 across statuses) ──────────────────────────────────────────
  const mStart = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  const [m1] = await db
    .insert(schema.missions)
    .values({
      organizationId: orgId,
      clientId: clientA?.id,
      vehicleId: v1?.id,
      driverId: userBrahim?.id,
      originCity: "Casablanca",
      destinationCity: "Marrakech",
      cargo: "Clinker",
      agreedPrice: 800000, // 8,000 MAD
      status: "completed",
      startDate: mStart(10),
      endDate: mStart(8),
    })
    .returning();

  const [m2] = await db
    .insert(schema.missions)
    .values({
      organizationId: orgId,
      clientId: clientB?.id,
      vehicleId: v2?.id,
      driverId: userKarim?.id,
      originCity: "Casablanca",
      destinationCity: "Rabat",
      cargo: "Sucre",
      agreedPrice: 350000, // 3,500 MAD
      status: "in_progress",
      startDate: mStart(1),
    })
    .returning();

  await db.insert(schema.missions).values([
    {
      organizationId: orgId,
      clientId: clientC?.id,
      vehicleId: v1?.id,
      driverId: userBrahim?.id,
      originCity: "Jorf Lasfar",
      destinationCity: "Safi",
      cargo: "Phosphate",
      agreedPrice: 1200000,
      status: "invoiced",
      startDate: mStart(20),
      endDate: mStart(18),
    },
    {
      organizationId: orgId,
      clientId: clientD?.id,
      vehicleId: v3?.id,
      originCity: "Tanger",
      destinationCity: "Fès",
      cargo: "Matériaux de construction",
      agreedPrice: 650000,
      status: "planned",
      startDate: mStart(-2), // 2 days from now
    },
    {
      organizationId: orgId,
      clientId: clientA?.id,
      vehicleId: v2?.id,
      driverId: userKarim?.id,
      originCity: "Casablanca",
      destinationCity: "Agadir",
      cargo: "Ciment",
      agreedPrice: 1050000,
      status: "completed",
      startDate: mStart(30),
      endDate: mStart(27),
    },
    {
      organizationId: orgId,
      clientId: clientB?.id,
      vehicleId: v1?.id,
      driverId: userBrahim?.id,
      originCity: "Kénitra",
      destinationCity: "Oujda",
      cargo: "Sucre raffiné",
      agreedPrice: 1800000,
      status: "cancelled",
      startDate: mStart(5),
    },
    {
      organizationId: orgId,
      clientId: clientC?.id,
      vehicleId: v3?.id,
      originCity: "Laâyoune",
      destinationCity: "Dakhla",
      cargo: "Phosphate transformé",
      agreedPrice: 2200000,
      status: "completed",
      startDate: mStart(45),
      endDate: mStart(42),
    },
    {
      organizationId: orgId,
      clientId: clientD?.id,
      vehicleId: v2?.id,
      driverId: userKarim?.id,
      originCity: "Casablanca",
      destinationCity: "Meknès",
      cargo: "Équipements BTP",
      agreedPrice: 720000,
      status: "completed",
      startDate: mStart(15),
      endDate: mStart(14),
    },
  ]);

  console.log("✓ Missions: 8");

  // ── Fuel Logs (20 — one deliberately over-consumption) ────────────────────
  const fuelLogs = [
    // V1 normal trips
    {
      vehicleId: v1?.id,
      driverId: userBrahim?.id,
      missionId: m1?.id,
      litres: 85,
      pplCentimes: 1280,
      odo: 1450,
      daysAgo: 10,
    },
    {
      vehicleId: v1?.id,
      driverId: userBrahim?.id,
      missionId: m1?.id,
      litres: 92,
      pplCentimes: 1280,
      odo: 1550,
      daysAgo: 9,
    },
    {
      vehicleId: v1?.id,
      driverId: null,
      missionId: null,
      litres: 60,
      pplCentimes: 1290,
      odo: 1600,
      daysAgo: 6,
    },
    {
      vehicleId: v1?.id,
      driverId: null,
      missionId: null,
      litres: 78,
      pplCentimes: 1290,
      odo: 1700,
      daysAgo: 3,
    },
    // V2 — one OVER-CONSUMPTION entry (130L for a ~200km trip = 65 L/100km vs baseline 22)
    {
      vehicleId: v2?.id,
      driverId: userKarim?.id,
      missionId: m2?.id,
      litres: 130,
      pplCentimes: 1285,
      odo: 750,
      daysAgo: 1,
    }, // ← anomaly
    {
      vehicleId: v2?.id,
      driverId: userKarim?.id,
      missionId: m2?.id,
      litres: 48,
      pplCentimes: 1285,
      odo: 800,
      daysAgo: 0,
    },
    {
      vehicleId: v2?.id,
      driverId: null,
      missionId: null,
      litres: 55,
      pplCentimes: 1280,
      odo: 620,
      daysAgo: 5,
    },
    {
      vehicleId: v2?.id,
      driverId: null,
      missionId: null,
      litres: 62,
      pplCentimes: 1280,
      odo: 680,
      daysAgo: 12,
    },
    {
      vehicleId: v2?.id,
      driverId: null,
      missionId: null,
      litres: 58,
      pplCentimes: 1280,
      odo: 530,
      daysAgo: 18,
    },
    // V3
    {
      vehicleId: v3?.id,
      driverId: null,
      missionId: null,
      litres: 38,
      pplCentimes: 1275,
      odo: 400,
      daysAgo: 4,
    },
    {
      vehicleId: v3?.id,
      driverId: null,
      missionId: null,
      litres: 42,
      pplCentimes: 1275,
      odo: 450,
      daysAgo: 8,
    },
    {
      vehicleId: v3?.id,
      driverId: null,
      missionId: null,
      litres: 36,
      pplCentimes: 1275,
      odo: 380,
      daysAgo: 14,
    },
    // More V1
    {
      vehicleId: v1?.id,
      driverId: null,
      missionId: null,
      litres: 88,
      pplCentimes: 1290,
      odo: 1800,
      daysAgo: 20,
    },
    {
      vehicleId: v1?.id,
      driverId: null,
      missionId: null,
      litres: 74,
      pplCentimes: 1285,
      odo: 1680,
      daysAgo: 25,
    },
    {
      vehicleId: v1?.id,
      driverId: null,
      missionId: null,
      litres: 91,
      pplCentimes: 1280,
      odo: 1900,
      daysAgo: 30,
    },
    // More V2
    {
      vehicleId: v2?.id,
      driverId: null,
      missionId: null,
      litres: 51,
      pplCentimes: 1280,
      odo: 560,
      daysAgo: 22,
    },
    {
      vehicleId: v2?.id,
      driverId: null,
      missionId: null,
      litres: 47,
      pplCentimes: 1280,
      odo: 510,
      daysAgo: 28,
    },
    {
      vehicleId: v2?.id,
      driverId: null,
      missionId: null,
      litres: 64,
      pplCentimes: 1280,
      odo: 600,
      daysAgo: 33,
    },
    // More V3
    {
      vehicleId: v3?.id,
      driverId: null,
      missionId: null,
      litres: 40,
      pplCentimes: 1275,
      odo: 420,
      daysAgo: 38,
    },
    {
      vehicleId: v3?.id,
      driverId: null,
      missionId: null,
      litres: 35,
      pplCentimes: 1275,
      odo: 360,
      daysAgo: 44,
    },
  ];

  for (const log of fuelLogs) {
    const filledAt = new Date();
    filledAt.setDate(filledAt.getDate() - log.daysAgo);
    const total = Math.round(log.litres * log.pplCentimes);
    await db.insert(schema.fuelLogs).values({
      organizationId: orgId,
      vehicleId: log.vehicleId,
      driverId: log.driverId ?? undefined,
      missionId: log.missionId ?? undefined,
      litres: log.litres,
      pricePerLitre: log.pplCentimes,
      total,
      odometer: log.odo,
      filledAt,
      source: "desktop",
    });
  }

  console.log("✓ Fuel logs: 20 (1 over-consumption anomaly on V2)");

  // ── Invoices (3 — one overdue) ────────────────────────────────────────────
  const issued30 = mStart(30);
  const issued10 = mStart(10);
  const due15ago = mStart(15);
  const due60 = new Date();
  due60.setDate(due60.getDate() + 60);
  const due30 = new Date();
  due30.setDate(due30.getDate() + 30);

  await db.insert(schema.invoices).values([
    {
      organizationId: orgId,
      clientId: clientA?.id,
      number: "INV-2026-0001",
      issueDate: issued30,
      dueDate: due15ago, // OVERDUE
      lines: [
        {
          description: "Transport Casablanca → Marrakech (Clinker)",
          quantity: 1,
          unitPrice: 800000,
          amount: 800000,
        },
      ],
      subtotal: 800000,
      vatRate: 0.2,
      vatAmount: 160000,
      total: 960000,
      status: "overdue",
    },
    {
      organizationId: orgId,
      clientId: clientC?.id,
      number: "INV-2026-0002",
      issueDate: issued30,
      dueDate: due60,
      lines: [
        {
          description: "Transport Jorf Lasfar → Safi (Phosphate)",
          quantity: 1,
          unitPrice: 1200000,
          amount: 1200000,
        },
      ],
      subtotal: 1200000,
      vatRate: 0.2,
      vatAmount: 240000,
      total: 1440000,
      status: "paid",
    },
    {
      organizationId: orgId,
      clientId: clientB?.id,
      number: "INV-2026-0003",
      issueDate: issued10,
      dueDate: due30,
      lines: [
        {
          description: "Transport Casablanca → Rabat (Sucre)",
          quantity: 1,
          unitPrice: 350000,
          amount: 350000,
        },
      ],
      subtotal: 350000,
      vatRate: 0.2,
      vatAmount: 70000,
      total: 420000,
      status: "sent",
    },
  ]);

  console.log("✓ Invoices: 3 (1 overdue, 1 paid, 1 sent)");

  // ── Employees (3) ─────────────────────────────────────────────────────────
  const contractEndSoon = new Date();
  contractEndSoon.setDate(contractEndSoon.getDate() + 25); // CDD expiring in 25 days

  await db.insert(schema.employees).values([
    {
      organizationId: orgId,
      userId: userBrahim?.id,
      fullName: "Brahim Ouali",
      role: "Chauffeur",
      baseSalary: 450000, // 4,500 MAD
      contractType: "cdi",
      cnssNumber: "CNSS-001",
    },
    {
      organizationId: orgId,
      userId: userKarim?.id,
      fullName: "Karim Alaoui",
      role: "Chauffeur",
      baseSalary: 380000, // 3,800 MAD
      contractType: "cdd",
      contractEndsAt: contractEndSoon, // EXPIRING → alert
      cnssNumber: "CNSS-002",
    },
    {
      organizationId: orgId,
      fullName: "Fatima Zahra Naciri",
      role: "Assistante administrative",
      baseSalary: 320000, // 3,200 MAD
      contractType: "cdi",
      cnssNumber: "CNSS-003",
    },
  ]);

  console.log("✓ Employees: 3 (1 CDD expiring soon → alert)");

  // ── Seed invoice_number_sequences ─────────────────────────────────────────
  await db.insert(schema.invoiceNumberSequences).values({
    organizationId: orgId,
    year: "2026",
    lastSequence: "3",
  });

  console.log("✓ Invoice sequence set to 3");
  console.log("\n🎉 Demo seed complete!");
  console.log(`   Org ID: ${orgId}`);
  console.log("   Login: jamal@transport-demo.ma / demo1234 (owner)");
  console.log("   Login: brahim@transport-demo.ma / demo1234 (driver)");

  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
