import { signup } from "@/app/actions/signup";
import { AuthCard } from "@/components/auth/auth-card";
import { Link } from "@/i18n/navigation";

export default function SignupPage() {
  return (
    <AuthCard titleKey="auth.signup">
      <form action={signup} className="space-y-4">
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-slate-700 mb-1">
            Nom de l&apos;entreprise
          </label>
          <input
            id="orgName"
            name="orgName"
            type="text"
            required
            placeholder="Transport Sarl"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Votre nom
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jamal Benali"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
        >
          Créer mon compte
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-amber-600 hover:text-amber-700">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}
