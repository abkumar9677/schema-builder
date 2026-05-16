import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { GeminiQuotaError, generateSchemaWithGemini, getDecryptedGeminiApiKey } from "../services/gemini.service.js";
import { toSql } from "../services/export.service.js";

const router = Router();
router.use(requireAuth);

router.post("/generate", async (req, res) => {
  const parsed = z.object({ projectId: z.string().uuid(), tableId: z.string().uuid() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: "VALIDATION_ERROR", issues: parsed.error.issues });
  const table = await prisma.projectTable.findFirst({
    where: { id: parsed.data.tableId, projectId: parsed.data.projectId, project: { userId: req.user!.sub } },
    include: { project: true }
  });
  if (!table) return res.status(404).json({ code: "TABLE_NOT_FOUND" });
  const storedKey = await prisma.apiKey.findUnique({ where: { userId: req.user!.sub } });
  if (!storedKey) return res.status(400).json({ code: "MISSING_GEMINI_KEY", message: "Save a Gemini API key before generating schemas" });

  try {
    const existingTables = await prisma.projectTable.findMany({ where: { projectId: table.projectId } });
    const schema = await generateSchemaWithGemini({
      apiKey: getDecryptedGeminiApiKey(storedKey),
      projectName: table.project.name,
      rdbmsType: table.project.rdbmsType,
      existingTables: existingTables.map((item) => item.name),
      tableName: table.name,
      tableDescription: table.description
    });
    const latest = await prisma.schemaVersion.findFirst({ where: { tableId: table.id }, orderBy: { version: "desc" } });
    const saved = await prisma.schemaVersion.create({
      data: {
        tableId: table.id,
        version: (latest?.version ?? 0) + 1,
        columnsJson: schema.columns,
        indexesJson: schema.indexes
      }
    });
    return res.status(201).json(saved);
  } catch (error) {
    if (error instanceof GeminiQuotaError) {
      return res.status(429).json({ code: "AI_QUOTA_EXHAUSTED", message: "Gemini free-tier token or request quota is exhausted. Try again after the quota resets." });
    }
    return res.status(502).json({ code: "AI_GENERATION_FAILED", message: error instanceof Error ? error.message : "Schema generation failed" });
  }
});

router.get("/:tableId/export/sql", async (req, res) => {
  const table = await prisma.projectTable.findFirst({
    where: { id: req.params.tableId, project: { userId: req.user!.sub } },
    include: { project: true, schemas: { orderBy: { version: "desc" }, take: 1 } }
  });
  if (!table?.schemas[0]) return res.status(404).json({ code: "SCHEMA_NOT_FOUND" });
  res.type("text/plain").send(toSql(table.name, table.schemas[0].columnsJson as never[], table.project.rdbmsType));
});

router.get("/:tableId/export/json", async (req, res) => {
  const schema = await prisma.schemaVersion.findFirst({
    where: { tableId: req.params.tableId, table: { project: { userId: req.user!.sub } } },
    orderBy: { version: "desc" }
  });
  if (!schema) return res.status(404).json({ code: "SCHEMA_NOT_FOUND" });
  res.json(schema);
});

export default router;
