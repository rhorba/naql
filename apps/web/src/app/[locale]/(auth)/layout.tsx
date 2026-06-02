export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">N</span>
            </div>
            <span className="text-2xl font-display font-bold text-white">Naql</span>
          </div>
          <p className="text-slate-400 text-sm">نقل · Transport</p>
        </div>
        {children}
      </div>
    </div>
  );
}
