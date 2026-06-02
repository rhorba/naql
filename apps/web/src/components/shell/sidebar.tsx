"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: string }[];
}

function useNavGroups(): NavGroup[] {
  const t = useTranslations("nav");

  return [
    {
      label: t("exploitation"),
      items: [
        { href: "/dashboard", label: t("exploitation"), icon: "⬛" },
        { href: "/missions", label: t("missions"), icon: "🗺" },
        { href: "/fleet", label: t("fleet"), icon: "🚛" },
        { href: "/fuel", label: t("fuel"), icon: "⛽" },
      ],
    },
    {
      label: t("finance"),
      items: [
        { href: "/clients", label: t("clients"), icon: "👥" },
        { href: "/invoicing", label: t("invoicing"), icon: "📄" },
        { href: "/payments", label: t("payments"), icon: "💳" },
        { href: "/cash", label: t("cash"), icon: "🏦" },
        { href: "/expenses", label: t("expenses"), icon: "🧾" },
        { href: "/profitability", label: t("profitability"), icon: "📊" },
      ],
    },
    {
      label: t("hr"),
      items: [
        { href: "/hr/employees", label: t("employees"), icon: "👤" },
        { href: "/hr/attendance", label: t("attendance"), icon: "📅" },
        { href: "/hr/payroll", label: t("payroll"), icon: "💰" },
      ],
    },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const groups = useNavGroups();

  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-slate-800">
        <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center shrink-0">
          <span className="text-slate-900 font-bold text-xs">N</span>
        </div>
        <span className="font-display font-bold text-white text-lg">Naql</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href as "/dashboard"}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition ${
                        isActive
                          ? "bg-slate-800 text-white font-medium"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: settings */}
      <div className="border-t border-slate-800 px-2 py-3">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <span className="text-base">⚙</span>
          <span>{t("settings")}</span>
        </Link>
      </div>
    </aside>
  );
}
