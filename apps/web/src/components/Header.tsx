import { Database, KeyRound, LogOut } from "lucide-react";

export function Header({
  quotaExhausted,
  onGeminiKeyClick,
  onLogout
}: {
  quotaExhausted: boolean;
  onGeminiKeyClick: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="border-b border-line bg-white">
      {quotaExhausted && (
        <div className="bg-amber-100 px-5 py-2 text-sm font-medium text-amber-900">
          Gemini free-tier token or request quota is exhausted. Schema generation will resume after your quota resets.
        </div>
      )}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Database className="h-7 w-7 text-brand" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold">AI Schema Builder</h1>
            <p className="text-sm text-slate-600">Generate table models, references, ERDs, and exports for backend services.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onGeminiKeyClick} className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium hover:bg-slate-50">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Gemini Key
          </button>
          <button
            onClick={onLogout}
            className="grid h-10 w-10 place-items-center rounded-md border border-line hover:bg-slate-50"
            title="Logout"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
