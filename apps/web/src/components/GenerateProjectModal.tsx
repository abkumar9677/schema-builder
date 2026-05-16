import { FormEvent, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { ApiError, generateProject, Project, saveGeminiKey } from "../lib/api";

export function GenerateProjectModal({
  isOpen,
  onClose,
  onGenerated,
  onQuota
}: {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (project: Project) => void;
  onQuota: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rdbmsType, setRdbmsType] = useState("postgresql");
  const [geminiKey, setGeminiKey] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsGenerating(true);

    try {
      if (geminiKey.trim()) {
        await saveGeminiKey(geminiKey.trim());
      }
      const project = await generateProject({ name, description, rdbmsType });
      onGenerated(project);
      setName("");
      setDescription("");
      setGeminiKey("");
      onClose();
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      if (apiError.code === "AI_QUOTA_EXHAUSTED") onQuota();
      setError(apiError.message ?? "Could not generate the database design. Add a fresh Gemini key and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <section className="w-full max-w-2xl rounded-md border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Generate Project Schema</h2>
            <p className="text-sm text-slate-600">Describe the backend service and Gemini will create the table model.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md border border-line hover:bg-slate-50" title="Close">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Project name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-teal-100"
                placeholder="Commerce API"
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Database</span>
              <select
                value={rdbmsType}
                onChange={(event) => setRdbmsType(event.target.value)}
                className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-teal-100"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
              </select>
            </label>
          </div>

          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Project description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={10}
              rows={5}
              className="w-full resize-none rounded-md border border-line px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-teal-100"
              placeholder="Example: Build a backend for an ecommerce store with customers, products, orders, payments, shipments, inventory, and admin users."
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Gemini API key</span>
            <input
              value={geminiKey}
              onChange={(event) => setGeminiKey(event.target.value)}
              type="password"
              className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-teal-100"
              placeholder="Optional if already saved"
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
              disabled={isGenerating}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
