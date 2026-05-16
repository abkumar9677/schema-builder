import { FormEvent, useState } from "react";
import { KeyRound, X } from "lucide-react";
import { ApiError, saveGeminiKey } from "../lib/api";

export function GeminiKeyModal({
  isOpen,
  quotaExhausted,
  onClose,
  onSaved
}: {
  isOpen: boolean;
  quotaExhausted: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await saveGeminiKey(apiKey.trim());
      setApiKey("");
      onSaved();
      onClose();
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(apiError.message ?? "Could not save the Gemini API key.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 px-4">
      <section className="w-full max-w-md rounded-md border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-brand" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold">Gemini API Key</h2>
              <p className="text-sm text-slate-600">
                {quotaExhausted ? "Quota is exhausted. Add another valid key to continue." : "Save or replace the key used for schema generation."}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md border border-line hover:bg-slate-50" title="Close">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {quotaExhausted && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              The current Gemini key hit its free-tier quota. Paste a fresh key here; it will be encrypted using the backend `GEMINI_API_KEY_ENCRYPTION_KEY` before storage.
            </div>
          )}

          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Gemini API key</span>
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              type="password"
              required
              minLength={20}
              className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-teal-100"
              placeholder="Paste your Gemini API key"
            />
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-md border border-line px-4 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save key"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
