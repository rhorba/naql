"use client";

import { createVehicle } from "@/app/actions/fleet";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export function VehicleForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const data = {
      code: fd.get("code") as string,
      registration: fd.get("registration") as string,
      make: (fd.get("make") as string) || undefined,
      model: (fd.get("model") as string) || undefined,
      year: fd.get("year") ? Number(fd.get("year")) : undefined,
      type: (fd.get("type") as string) || undefined,
      capacityKg: fd.get("capacityKg") ? Number(fd.get("capacityKg")) : undefined,
      baselineConsumption: fd.get("baselineConsumption")
        ? Number(fd.get("baselineConsumption"))
        : undefined,
    };

    try {
      await createVehicle(data);
      router.push("/fleet");
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
      <div className="grid grid-cols-2 gap-4">
        <Field label="Code *" name="code" placeholder="50387" required />
        <Field label="Immatriculation *" name="registration" placeholder="A-12345" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Marque" name="make" placeholder="FUSO" />
        <Field label="Modèle" name="model" placeholder="Fighter" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Année" name="year" type="number" placeholder="2020" />
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
            Type
          </label>
          <select
            id="type"
            name="type"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          >
            <option value="">—</option>
            <option value="truck">Camion</option>
            <option value="van">Fourgon</option>
            <option value="trailer">Remorque</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <Field label="Capacité (kg)" name="capacityKg" type="number" placeholder="10000" />
      </div>

      <Field
        label="Consommation de base (L/100km)"
        name="baselineConsumption"
        type="number"
        placeholder="25"
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/fleet")}
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

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

function Field({ label, name, type = "text", placeholder, required }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
      />
    </div>
  );
}
