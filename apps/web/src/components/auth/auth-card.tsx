import type { ReactNode } from "react";

interface AuthCardProps {
  titleKey: string;
  children: ReactNode;
}

export function AuthCard({ titleKey, children }: AuthCardProps) {
  const titles: Record<string, string> = {
    "auth.login": "Connexion",
    "auth.signup": "Créer un compte",
  };

  return (
    <div className="bg-white rounded-xl shadow-dropdown p-8">
      <h1 className="text-xl font-display font-bold text-slate-900 mb-6">
        {titles[titleKey] ?? titleKey}
      </h1>
      {children}
    </div>
  );
}
