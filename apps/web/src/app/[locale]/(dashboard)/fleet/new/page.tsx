import { VehicleForm } from "@/components/fleet/vehicle-form";

export default function NewVehiclePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Nouveau véhicule</h1>
        <p className="text-slate-500 text-sm mt-1">Enregistrer un véhicule dans la flotte</p>
      </div>
      <VehicleForm />
    </div>
  );
}
