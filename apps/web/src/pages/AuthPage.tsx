import { Database, KeyRound } from "lucide-react";
import { getOAuthUrl } from "../lib/api";

export function AuthPage({ authError }: { authError?: string }) {
  return (
    <main className="grid min-h-full place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Database className="h-8 w-8 text-brand" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-semibold">AI Schema Builder</h1>
            <p className="text-sm text-slate-600">Sign in to continue your schema workspace.</p>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href={getOAuthUrl("google")}
            className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-slate-50"
          >
            <KeyRound className="h-4 w-4 text-brand" aria-hidden="true" />
            Continue with Google
          </a>
          <a
            href={getOAuthUrl("microsoft")}
            className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-slate-50"
          >
            <KeyRound className="h-4 w-4 text-brand" aria-hidden="true" />
            Continue with Microsoft
          </a>
        </div>

        {authError && (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {authError}
          </div>
        )}
      </section>
    </main>
  );
}
