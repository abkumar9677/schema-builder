import { FormEvent, useState } from "react";
import { Database, LogIn, UserPlus } from "lucide-react";
import { ApiError, loginUser, registerUser, setAuthToken } from "../lib/api";

type AuthMode = "login" | "register";

export function AuthPage({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = isRegister
        ? await registerUser(email, password)
        : await loginUser(email, password);
      setAuthToken(response.token);
      onAuthenticated();
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(apiError.message ?? "Authentication failed. Check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-full place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Database className="h-8 w-8 text-brand" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-semibold">AI Schema Builder</h1>
            <p className="text-sm text-slate-600">
              {isRegister ? "Create your account to start modeling schemas." : "Sign in to continue your schema workspace."}
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-md border border-line bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded px-3 py-2 text-sm font-medium ${!isRegister ? "bg-white text-ink shadow-sm" : "text-slate-600"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded px-3 py-2 text-sm font-medium ${isRegister ? "bg-white text-ink shadow-sm" : "text-slate-600"}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-teal-100"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={8}
              required
              className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-teal-100"
              placeholder="At least 8 characters"
            />
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRegister ? <UserPlus className="h-4 w-4" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
            {isSubmitting ? "Please wait..." : isRegister ? "Create account" : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
