"use client";

import { useRouter } from "@/i18n/navigation";
import type { Role } from "@naql/core";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

const roleKeys: Record<Role, "owner" | "manager" | "accountant" | "driver"> = {
  owner: "owner",
  manager: "manager",
  accountant: "accountant",
  driver: "driver",
};

interface TopBarProps {
  orgName: string;
  userName: string;
  role: Role;
  locale: string;
}

export function TopBar({ orgName, userName, role, locale }: TopBarProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tRole = useTranslations("roles");

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-slate-900">{orgName}</span>
        <span className="text-slate-400" aria-hidden="true">
          ·
        </span>
        <span className="text-slate-600">{tRole(roleKeys[role])}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Locale switcher */}
        <nav aria-label="Language selector" className="flex gap-1">
          {(["fr", "ar", "en"] as const).map((l) => (
            <a
              key={l}
              href={`/${l}/dashboard`}
              lang={l}
              aria-current={l === locale ? "page" : undefined}
              className={`px-2 py-1 text-xs font-medium rounded transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
                l === locale ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {l.toUpperCase()}
            </a>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-amber-700 text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-slate-700">{userName}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-slate-400 hover:text-slate-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 rounded"
          >
            {tCommon("signOut")}
          </button>
        </div>
      </div>
    </header>
  );
}
