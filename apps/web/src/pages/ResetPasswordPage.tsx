import { FormEvent, useState } from "react";
import { Database, KeyRound } from "lucide-react";
import { ApiError, resetPassword, setAuthToken } from "../lib/api";

export function ResetPasswordPage({ token, onAuthenticated, onBackToLogin }: {
  token: string;
  onAuthenticated: () => void;
  onBackToLogin: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPassword(token, password);
      setAuthToken(response.token);
      onAuthenticated();
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(apiError.message ?? "Password reset failed.");
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
            <h1 className="text-2xl font-semibold">Reset password</h1>
            <p className="text-sm text-slate-600">Choose a new password for AI Schema Builder.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">New password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-teal-100"
              placeholder="At least 8 characters"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Confirm password</span>
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-teal-100"
              placeholder="Repeat new password"
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
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Please wait..." : "Reset password"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button type="button" onClick={onBackToLogin} className="font-medium text-brand hover:text-teal-800">
            Back to login
          </button>
        </div>
      </section>
    </main>
  );
}
