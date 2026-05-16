import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { GeminiQuotaError, generateProjectDesignWithGemini, getDecryptedGeminiApiKey } from "../services/gemini.service.js";

const router = Router();
router.use(requireAuth);

const projectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  rdbmsType: z.enum(["postgresql", "mysql", "sqlite"]).default("postgresql")
});

const tableSchema = z.object({
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  description: z.string().max(1000).optional()
});

const generatedProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  rdbmsType: z.enum(["postgresql", "mysql", "sqlite"]).default("postgresql")
});

router.get("/", async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user!.sub },
    include: { tables: true },
    orderBy: { updatedAt: "desc" }
  });
  res.json(projects);
});

router.post("/", async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: "VALIDATION_ERROR", issues: parsed.error.issues });
  const project = await prisma.project.create({ data: { ...parsed.data, userId: req.user!.sub } });
  res.status(201).json(project);
});

router.post("/generate", async (req, res) => {
  const parsed = generatedProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: "VALIDATION_ERROR", issues: parsed.error.issues });

  const storedKey = await prisma.apiKey.findUnique({ where: { userId: req.user!.sub } });
  if (!storedKey) {
    return res.status(400).json({ code: "MISSING_GEMINI_KEY", message: "Save a Gemini API key before generating a project schema." });
  }

  try {
    const design = await generateProjectDesignWithGemini({
      apiKey: getDecryptedGeminiApiKey(storedKey),
      projectName: parsed.data.name,
      projectDescription: parsed.data.description,
      rdbmsType: parsed.data.rdbmsType
    });

    const created = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          userId: req.user!.sub,
          name: parsed.data.name,
          description: parsed.data.description,
          rdbmsType: parsed.data.rdbmsType
        }
      });

      const tableMap = new Map<string, string>();
      for (const tableDesign of design.tables.slice(0, 20)) {
        const table = await tx.projectTable.create({
          data: {
            projectId: project.id,
            name: tableDesign.name,
            description: tableDesign.description
          }
        });
        tableMap.set(tableDesign.name, table.id);
        await tx.schemaVersion.create({
          data: {
            tableId: table.id,
            version: 1,
            columnsJson: tableDesign.columns,
            indexesJson: tableDesign.indexes ?? []
          }
        });
      }

      for (const reference of design.references ?? []) {
        const fromTableId = tableMap.get(reference.fromTable);
        const toTableId = tableMap.get(reference.toTable);
        if (!fromTableId || !toTableId) continue;
        await tx.tableReference.create({
          data: {
            projectId: project.id,
            fromTableId,
            fromCol: reference.fromColumn,
            toTableId,
            toCol: reference.toColumn,
            accepted: true
          }
        });
      }

      return tx.project.findUniqueOrThrow({
        where: { id: project.id },
        include: {
          tables: { include: { schemas: { orderBy: { version: "desc" }, take: 1 } } },
          references: true
        }
      });
    });

    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof GeminiQuotaError) {
      return res.status(429).json({ code: "AI_QUOTA_EXHAUSTED", message: "Gemini free-tier token or request quota is exhausted. Try again after the quota resets." });
    }
    return res.status(502).json({ code: "AI_PROJECT_GENERATION_FAILED", message: error instanceof Error ? error.message : "Project schema generation failed" });
  }
});

router.get("/:id", async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.user!.sub },
    include: {
      tables: { include: { schemas: { orderBy: { version: "desc" }, take: 1 } } },
      references: true
    }
  });
  if (!project) return res.status(404).json({ code: "PROJECT_NOT_FOUND" });
  res.json(project);
});

router.get("/:id/tables", async (req, res) => {
  const tables = await prisma.projectTable.findMany({
    where: { projectId: req.params.id, project: { userId: req.user!.sub } },
    include: { schemas: { orderBy: { version: "desc" }, take: 1 } }
  });
  res.json(tables);
});

router.post("/:id/tables", async (req, res) => {
  const parsed = tableSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: "VALIDATION_ERROR", issues: parsed.error.issues });
  const count = await prisma.projectTable.count({ where: { projectId: req.params.id } });
  if (count >= 200) return res.status(409).json({ code: "TABLE_LIMIT_REACHED", message: "Maximum 200 tables per project" });
  const table = await prisma.projectTable.create({ data: { ...parsed.data, projectId: req.params.id } });
  res.status(201).json(table);
});

export default router;
