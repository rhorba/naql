import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { db, withOrgContext } from "@naql/db";
import { attendance, employees } from "@naql/db/schema";
import { desc, eq } from "drizzle-orm";

const statusConfig = {
  present: { label: "Présent", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  absent: { label: "Absent", className: "bg-red-50 text-red-700 ring-red-200" },
  leave: { label: "Congé", className: "bg-blue-50 text-blue-700 ring-blue-200" },
} as const;

export default async function AttendancePage() {
  const session = await auth();
  const orgId = session?.user.organizationId;

  const [records, employeeList] = await withOrgContext(db, orgId, async (tx) => {
    const r = await tx
      .select()
      .from(attendance)
      .where(eq(attendance.organizationId, orgId))
      .orderBy(desc(attendance.date))
      .limit(200);
    const e = await tx
      .select({ id: employees.id, fullName: employees.fullName })
      .from(employees)
      .where(eq(employees.organizationId, orgId));
    return [r, e] as const;
  });

  const empMap = new Map(employeeList.map((e) => [e.id, e.fullName]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Pointage</h1>
          <p className="text-slate-500 text-sm mt-1">
            {records.length} entrée{records.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/hr/attendance/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition"
        >
          + Enregistrer présence
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Date", "Employé", "Statut", "Heures"].map((h) => (
                <th
                  key={h}
                  className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => {
              const s = statusConfig[r.status];
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 tabular text-slate-600">
                    {new Date(r.date).toLocaleDateString("fr-MA")}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {empMap.get(r.employeeId) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${s.className}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular text-slate-500">
                    {r.hours != null ? `${r.hours}h` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
