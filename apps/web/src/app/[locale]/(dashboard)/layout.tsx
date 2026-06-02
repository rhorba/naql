import { auth } from "@/auth";
import { Sidebar } from "@/components/shell/sidebar";
import { SkipLink } from "@/components/shell/skip-link";
import { TopBar } from "@/components/shell/topbar";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const { name, role, organizationId } = session.user;

  return (
    <>
      <SkipLink />
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar orgName={organizationId} userName={name ?? ""} role={role} locale={locale} />
          <main id="main-content" className="flex-1 overflow-y-auto p-6" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
