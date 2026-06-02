import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { advances, employees } from "@naql/db/schema";
import { and, eq } from "drizzle-orm";

const contractLabel: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  interim: "Intérim",
};

export default async function EmployeesPage() {
  const session = await auth();
  const orgId = session?.user.organizationId;
  const canSeeSalary = ["owner", "accountant"].includes(session?.user.role);

  const [employeeList, advanceList] = await withOrgContext(db, orgId, async (tx) => {
    const e = await tx
      .select()
      .from(employees)
      .where(eq(employees.organizationId, orgId))
      .orderBy(employees.fullName);
    const a = await tx
      .select()
      .from(advances)
      .where(and(eq(advances.organizationId, orgId), eq(advances.repaid, false)));
    return [e, a] as const;
  });

  const advancesByEmp = new Map<string, number>();
  for (const adv of advanceList) {
    advancesByEmp.set(adv.employeeId, (advancesByEmp.get(adv.employeeId) ?? 0) + adv.amount);
  }

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Employés</h1>
          <p className="text-slate-500 text-sm mt-1">
            {employeeList.length} employé{employeeList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/hr/employees/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition"
        >
          + Nouvel employé
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {[
                "Nom",
                "Poste",
                "Contrat",
                "Fin contrat",
                canSeeSalary ? "Salaire de base" : null,
                "Avances non remb.",
                "",
              ]
                .filter(Boolean)
                .map((h) => (
                  <th
                    key={String(h)}
                    className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employeeList.map((emp) => {
              const contractExpiring = emp.contractEndsAt && emp.contractEndsAt <= soon;
              const contractExpired = emp.contractEndsAt && emp.contractEndsAt < now;
              const pendingAdvances = advancesByEmp.get(emp.id) ?? 0;

              return (
                <tr key={emp.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-900">{emp.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.role}</td>
                  <td className="px-4 py-3">
                    {emp.contractType ? (
                      <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {contractLabel[emp.contractType]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 tabular text-slate-500">
                    {emp.contractEndsAt ? (
                      <span
                        className={
                          contractExpired
                            ? "text-red-600 font-semibold"
                            : contractExpiring
                              ? "text-amber-600 font-medium"
                              : ""
                        }
                      >
                        {new Date(emp.contractEndsAt).toLocaleDateString("fr-MA")}
                        {contractExpired && " ✗"}
                        {contractExpiring && !contractExpired && " ⚠"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  {canSeeSalary && (
                    <td className="px-4 py-3 tabular font-medium text-slate-900">
                      {formatMAD(emp.baseSalary as Money)}
                    </td>
                  )}
                  <td className="px-4 py-3 tabular">
                    {pendingAdvances > 0 ? (
                      <span className="text-amber-600 font-medium">
                        {formatMAD(pendingAdvances as Money)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link
                      href={`/hr/employees/${emp.id}`}
                      className="text-xs text-slate-500 hover:text-slate-900 font-medium"
                    >
                      Détail →
                    </Link>
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
