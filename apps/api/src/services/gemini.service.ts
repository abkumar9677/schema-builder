import { env } from "../config/env.js";
import { decryptSecret } from "../utils/crypto.js";

export type SchemaColumn = {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  default?: string;
  foreignKey?: { table: string; column: string };
};

export type GeneratedSchema = {
  columns: SchemaColumn[];
  indexes: Array<{ name: string; columns: string[]; unique?: boolean }>;
};

export type GeneratedProjectDesign = {
  tables: Array<{
    name: string;
    description: string;
    columns: SchemaColumn[];
    indexes: Array<{ name: string; columns: string[]; unique?: boolean }>;
  }>;
  references: Array<{
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
  }>;
};

export class GeminiQuotaError extends Error {
  constructor(message = "Gemini free-tier quota exhausted") {
    super(message);
    this.name = "GeminiQuotaError";
  }
}

type EncryptedGeminiKey = {
  encryptedKey: string;
  iv: string;
  authTag: string;
};

export function getDecryptedGeminiApiKey(storedKey: EncryptedGeminiKey) {
  if (!env.GEMINI_API_KEY_ENCRYPTION_KEY.trim()) {
    throw new Error("GEMINI_API_KEY_ENCRYPTION_KEY is not configured");
  }
  return decryptSecret(storedKey);
}

async function callGeminiJson<T>(apiKey: string, prompt: string, model = env.GEMINI_MODEL): Promise<T> {
  const url = `${env.GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    }),
    signal: AbortSignal.timeout(30_000)
  });

  if (response.status === 429) throw new GeminiQuotaError();
  if (response.status === 401 || response.status === 403) {
    throw new Error("Invalid Google Gemini API key");
  }
  if (!response.ok) throw new Error(`Gemini request failed with ${response.status}`);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini response did not include JSON");
  return JSON.parse(text) as T;
}

export async function generateProjectDesignWithGemini(input: {
  apiKey: string;
  projectName: string;
  projectDescription: string;
  rdbmsType: string;
  model?: string;
}): Promise<GeneratedProjectDesign> {
  const prompt = [
    "You are a senior backend database architect. Return only strict JSON without markdown.",
    `Project name: ${input.projectName}`,
    `Project description: ${input.projectDescription}`,
    `Target RDBMS: ${input.rdbmsType}`,
    "Design the core database table model for this backend service.",
    "Use practical table names, column names, data types, nullable flags, primary keys, defaults, unique flags, indexes, and foreign key references.",
    "Return 4 to 8 essential tables unless the description clearly needs fewer.",
    "Format exactly:",
    "{\"tables\":[{\"name\":\"users\",\"description\":\"Registered users\",\"columns\":[{\"name\":\"id\",\"type\":\"UUID\",\"nullable\":false,\"primaryKey\":true},{\"name\":\"email\",\"type\":\"VARCHAR(255)\",\"nullable\":false,\"unique\":true}],\"indexes\":[{\"name\":\"idx_users_email\",\"columns\":[\"email\"],\"unique\":true}]}],\"references\":[{\"fromTable\":\"orders\",\"fromColumn\":\"user_id\",\"toTable\":\"users\",\"toColumn\":\"id\"}]}"
  ].join("\n");

  return callGeminiJson<GeneratedProjectDesign>(input.apiKey, prompt, input.model);
}

export async function generateSchemaWithGemini(input: {
  apiKey: string;
  projectName: string;
  rdbmsType: string;
  existingTables: string[];
  tableName: string;
  tableDescription?: string | null;
  model?: string;
}): Promise<GeneratedSchema> {
  const prompt = [
    "You are a senior database architect. Return only strict JSON without markdown.",
    `Project: ${input.projectName}`,
    `RDBMS: ${input.rdbmsType}`,
    `Existing tables: ${input.existingTables.join(", ") || "none"}`,
    `Target table: ${input.tableName}`,
    `Table purpose: ${input.tableDescription || "not provided"}`,
    "Format: {\"columns\":[{\"name\":\"id\",\"type\":\"UUID\",\"nullable\":false,\"primaryKey\":true}],\"indexes\":[]}"
  ].join("\n");

  return callGeminiJson<GeneratedSchema>(input.apiKey, prompt, input.model);
}
