import type { Money } from "@naql/core";
import { add, subtract, zero } from "@naql/core";

export interface ProfitabilityInput {
  revenue: Money; // sum of paid/partial invoice totals
  fuelCost: Money;
  salaryCost: Money;
  maintenanceCost: Money;
  otherExpenses: Money;
  totalDistanceKm: number; // for cost-per-km
}

export interface ProfitabilityResult {
  revenue: Money;
  totalCosts: Money;
  grossMargin: Money;
  marginPct: number; // 0–100
  costPerKm: Money; // centimes per km
}

export function computeProfitability(input: ProfitabilityInput): ProfitabilityResult {
  const totalCosts = [
    input.fuelCost,
    input.salaryCost,
    input.maintenanceCost,
    input.otherExpenses,
  ].reduce(add, zero());

  const grossMargin = subtract(input.revenue, totalCosts);
  const marginPct = input.revenue > 0 ? Math.round((grossMargin / input.revenue) * 1000) / 10 : 0;

  const costPerKm =
    input.totalDistanceKm > 0 ? (Math.round(totalCosts / input.totalDistanceKm) as Money) : zero();

  return { revenue: input.revenue, totalCosts, grossMargin, marginPct, costPerKm };
}

export interface VehicleMargin {
  vehicleId: string;
  vehicleCode: string;
  revenue: Money;
  fuelCost: Money;
  otherCosts: Money;
  margin: Money;
  marginPct: number;
  distanceKm: number;
  costPerKm: Money;
}

export interface ClientMargin {
  clientId: string;
  clientName: string;
  revenue: Money;
  missionsCount: number;
  margin: Money;
  marginPct: number;
}
