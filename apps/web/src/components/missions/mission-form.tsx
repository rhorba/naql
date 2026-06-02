"use client";

import { createMission } from "@/app/actions/missions";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

interface Props {
  vehicles: { id: string; code: string; make: string | null }[];
  clients: { id: string; name: string }[];
  drivers: { id: string; name: string }[];
}

export function MissionForm({ vehicles, clients, drivers }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    try {
      await createMission({
        clientId: fd.get("clientId") as string,
        vehicleId: (fd.get("vehicleId") as string) || undefined,
        driverId: (fd.get("driverId") as string) || undefined,
        originCity: fd.get("originCity") as string,
        destinationCity: fd.get("destinationCity") as string,
        cargo: (fd.get("cargo") as string) || undefined,
        agreedPrice: Math.round(Number(fd.get("agreedPrice")) * 100), // convert MAD → centimes
        startDate: new Date(fd.get("startDate") as string).toISOString(),
      });
      router.push("/missions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
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
        <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 mb-1">
          Client *
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
        >
          <option value="">Sélectionner un client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="originCity" className="block text-sm font-medium text-slate-700 mb-1">
            Origine *
          </label>
          <input
            id="originCity"
            name="originCity"
            required
            placeholder="Casablanca"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
        <div>
          <label
            htmlFor="destinationCity"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Destination *
          </label>
          <input
            id="destinationCity"
            name="destinationCity"
            required
            placeholder="Marrakech"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cargo" className="block text-sm font-medium text-slate-700 mb-1">
          Marchandise
        </label>
        <input
          id="cargo"
          name="cargo"
          placeholder="Clinker, Sucre…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="agreedPrice" className="block text-sm font-medium text-slate-700 mb-1">
            Prix convenu (MAD HT) *
          </label>
          <input
            id="agreedPrice"
            name="agreedPrice"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="8000"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">
            Date de départ *
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="vehicleId" className="block text-sm font-medium text-slate-700 mb-1">
            Véhicule
          </label>
          <select
            id="vehicleId"
            name="vehicleId"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          >
            <option value="">— Assigner plus tard</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.code} {v.make ? `(${v.make})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="driverId" className="block text-sm font-medium text-slate-700 mb-1">
            Chauffeur
          </label>
          <select
            id="driverId"
            name="driverId"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          >
            <option value="">— Assigner plus tard</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/missions")}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 disabled:opacity-60 transition"
        >
          {loading ? "Création…" : "Créer la mission"}
        </button>
      </div>
    </form>
  );
}
