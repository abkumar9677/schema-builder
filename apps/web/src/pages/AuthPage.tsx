import { FormEvent, useState } from "react";
import { Database, KeyRound, LogIn, Mail, UserPlus } from "lucide-react";
import { ApiError, getOAuthUrl, loginUser, registerUser, requestPasswordReset, setAuthToken } from "../lib/api";

type AuthMode = "login" | "register" | "forgot";

export function AuthPage({ authError, onAuthenticated }: { authError?: string; onAuthenticated: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const error = formError || authError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const response = isRegister
        ? await registerUser(email, password)
        : await loginUser(email, password);
      setAuthToken(response.token);
      onAuthenticated();
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setFormError(apiError.message ?? "Authentication failed. Check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setMessage("");
    setResetUrl("");
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
      if (response.resetUrl) setResetUrl(response.resetUrl);
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setFormError(apiError.message ?? "Password reset request failed.");
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
              {isForgot ? "Reset your password for your schema workspace." : isRegister ? "Create your account to start modeling schemas." : "Sign in to continue your schema workspace."}
            </p>
          </div>
        </div>

        {!isForgot && (
          <>
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

            <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase text-slate-500">
              <div className="h-px flex-1 bg-line" />
              <span>Email</span>
              <div className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        {!isForgot && <div className="mb-5 grid grid-cols-2 rounded-md border border-line bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setFormError("");
              setMessage("");
            }}
            className={`rounded px-3 py-2 text-sm font-medium ${!isRegister ? "bg-white text-ink shadow-sm" : "text-slate-600"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setFormError("");
              setMessage("");
            }}
            className={`rounded px-3 py-2 text-sm font-medium ${isRegister ? "bg-white text-ink shadow-sm" : "text-slate-600"}`}
          >
            Register
          </button>
        </div>}

        <form onSubmit={isForgot ? handleForgotPassword : handleSubmit} className="space-y-4">
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

          {!isForgot && <label className="block">
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
          </label>}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800" role="status">
              {message}
            </div>
          )}
          {resetUrl && (
            <a
              href={resetUrl}
              className="block break-words rounded-md border border-line bg-slate-50 px-3 py-2 text-sm font-medium text-brand hover:bg-slate-100"
            >
              Open reset link
            </a>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isForgot ? <Mail className="h-4 w-4" aria-hidden="true" /> : isRegister ? <UserPlus className="h-4 w-4" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
            {isSubmitting ? "Please wait..." : isForgot ? "Send reset link" : isRegister ? "Create account" : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {isForgot ? (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFormError("");
                setMessage("");
                setResetUrl("");
              }}
              className="font-medium text-brand hover:text-teal-800"
            >
              Back to login
            </button>
          ) : !isRegister ? (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setFormError("");
                setMessage("");
                setResetUrl("");
              }}
              className="font-medium text-brand hover:text-teal-800"
            >
              Forgot password?
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
