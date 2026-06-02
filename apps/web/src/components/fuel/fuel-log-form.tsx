"use client";

import { createFuelLog } from "@/app/actions/fuel";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

interface Props {
  vehicles: { id: string; code: string; make: string | null }[];
}

export function FuelLogForm({ vehicles }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    try {
      await createFuelLog({
        vehicleId: fd.get("vehicleId") as string,
        litres: Number(fd.get("litres")),
        pricePerLitre: Math.round(Number(fd.get("pricePerLitre")) * 100), // MAD → centimes
        odometer: fd.get("odometer") ? Number(fd.get("odometer")) : undefined,
        station: (fd.get("station") as string) || undefined,
        filledAt: new Date(fd.get("filledAt") as string).toISOString(),
      });
      router.push("/fuel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-slate-200 shadow-card p-6 space-y-5"
    >
      <div>
        <label htmlFor="vehicleId" className="block text-sm font-medium text-slate-700 mb-1">
          Véhicule *
        </label>
        <select
          id="vehicleId"
          name="vehicleId"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
        >
          <option value="">Sélectionner</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.code} {v.make ? `(${v.make})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="litres" className="block text-sm font-medium text-slate-700 mb-1">
            Litres *
          </label>
          <input
            id="litres"
            name="litres"
            type="number"
            step="0.1"
            min="1"
            required
            placeholder="65.5"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
        <div>
          <label htmlFor="pricePerLitre" className="block text-sm font-medium text-slate-700 mb-1">
            Prix/litre (MAD) *
          </label>
          <input
            id="pricePerLitre"
            name="pricePerLitre"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="12.85"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="odometer" className="block text-sm font-medium text-slate-700 mb-1">
            Compteur kilométrique (km)
          </label>
          <input
            id="odometer"
            name="odometer"
            type="number"
            min="0"
            placeholder="125000"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
        <div>
          <label htmlFor="station" className="block text-sm font-medium text-slate-700 mb-1">
            Station
          </label>
          <input
            id="station"
            name="station"
            placeholder="Afriquia, Total…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
      </div>

      <div>
        <label htmlFor="filledAt" className="block text-sm font-medium text-slate-700 mb-1">
          Date *
        </label>
        <input
          id="filledAt"
          name="filledAt"
          type="date"
          required
          defaultValue={new Date().toISOString().split("T")[0]}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/fuel")}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 disabled:opacity-60 transition"
        >
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
