import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { encryptSecret } from "../utils/crypto.js";

const router = Router();
router.use(requireAuth);

router.put("/gemini", async (req, res) => {
  const parsed = z.object({ apiKey: z.string().min(20) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: "VALIDATION_ERROR", issues: parsed.error.issues });
  const encrypted = encryptSecret(parsed.data.apiKey);
  await prisma.apiKey.upsert({
    where: { userId: req.user!.sub },
    create: { userId: req.user!.sub, ...encrypted },
    update: encrypted
  });
  res.status(204).send();
});

export default router;
