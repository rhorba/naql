"use client";

import { createFuelLog } from "@/app/actions/fuel";
import { useRouter } from "@/i18n/navigation";
import { useRef, useState } from "react";

interface OcrDraft {
  litres?: number;
  pricePerLitre?: number; // MAD (float)
  total?: number;
  date?: string;
  station?: string;
  confidence: number;
  requiresReview: boolean;
}

interface Props {
  vehicles: { id: string; code: string; make: string | null }[];
}

const CONFIDENCE_PCT = (c: number) => `${Math.round(c * 100)}%`;

export function OcrReceiptForm({ vehicles }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<OcrDraft | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields (pre-filled from OCR, user can correct)
  const [vehicleId, setVehicleId] = useState("");
  const [litres, setLitres] = useState("");
  const [pricePerLitre, setPricePerLitre] = useState("");
  const [station, setStation] = useState("");
  const [filledAt, setFilledAt] = useState(new Date().toISOString().split("T")[0] ?? "");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setError(null);
    setDraft(null);

    try {
      const fd = new FormData();
      fd.append("receipt", file);

      const res = await fetch("/api/ocr/receipt", { method: "POST", body: fd });
      if (!res.ok) throw new Error("OCR request failed");

      const data = (await res.json()) as { draft: OcrDraft };
      const d = data.draft;
      setDraft(d);

      // Pre-fill editable fields
      if (d.litres) setLitres(String(d.litres));
      if (d.pricePerLitre) setPricePerLitre(String(d.pricePerLitre));
      if (d.station) setStation(d.station);
      if (d.date) setFilledAt(d.date.split("T")[0] ?? filledAt);
    } catch {
      setError("Analyse OCR échouée — veuillez saisir les données manuellement.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!vehicleId || !litres || !pricePerLitre) {
      setError("Véhicule, litres et prix sont requis.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createFuelLog({
        vehicleId,
        litres: Number(litres),
        pricePerLitre: Math.round(Number(pricePerLitre) * 100),
        station: station || undefined,
        filledAt: new Date(filledAt).toISOString(),
      });
      router.push("/fuel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <button
        type="button"
        className="w-full bg-white rounded-lg border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-amber-400 transition"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        {analyzing ? (
          <div className="space-y-2">
            <div className="text-3xl animate-pulse">🔍</div>
            <p className="text-slate-600 font-medium">Analyse du reçu en cours…</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl">📷</div>
            <p className="text-slate-700 font-medium">Cliquez pour photographier un reçu</p>
            <p className="text-slate-400 text-sm">JPG, PNG · max 10 MB</p>
          </div>
        )}
      </button>

      {/* OCR confidence badge */}
      {draft && (
        <div
          className={`rounded-lg px-4 py-3 flex items-center gap-2 text-sm ${
            draft.requiresReview
              ? "bg-amber-50 border border-amber-200 text-amber-800"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          <span>{draft.requiresReview ? "⚠" : "✓"}</span>
          <span>
            Confiance OCR: <strong>{CONFIDENCE_PCT(draft.confidence)}</strong>
            {draft.requiresReview
              ? " — Veuillez vérifier les champs ci-dessous avant de sauvegarder."
              : " — Données extraites avec succès. Vérifiez puis sauvegardez."}
          </span>
        </div>
      )}

      {/* Form fields */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-card p-6 space-y-4">
        <div>
          <label htmlFor="vehicleId" className="block text-sm font-medium text-slate-700 mb-1">
            Véhicule *
          </label>
          <select
            id="vehicleId"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
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
          <Field
            label="Litres *"
            value={litres}
            onChange={setLitres}
            type="number"
            placeholder="65.5"
            highlight={!!draft && !draft.requiresReview}
          />
          <Field
            label="Prix / litre (MAD) *"
            value={pricePerLitre}
            onChange={setPricePerLitre}
            type="number"
            placeholder="12.85"
            highlight={!!draft && !draft.requiresReview}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Station"
            value={station}
            onChange={setStation}
            placeholder="Afriquia"
            highlight={!!draft?.station && !draft.requiresReview}
          />
          <div>
            <label htmlFor="filledAt" className="block text-sm font-medium text-slate-700 mb-1">
              Date *
            </label>
            <input
              id="filledAt"
              type="date"
              value={filledAt}
              onChange={(e) => setFilledAt(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/fuel")}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={saving || !vehicleId || !litres || !pricePerLitre}
            onClick={handleSave}
            className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 disabled:opacity-60 transition"
          >
            {saving ? "Enregistrement…" : "Confirmer et sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  highlight?: boolean;
}

function Field({ label, value, onChange, type = "text", placeholder, highlight }: FieldProps) {
  const id = label.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
          highlight
            ? "border-emerald-400 bg-emerald-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            : "border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        }`}
      />
    </div>
  );
}
