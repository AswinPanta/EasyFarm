import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createScan, getScansByUser, getAllScans, deleteScan, getScanById } from "./db";
import { storagePut } from "./storage";
import * as fs from "fs";
import * as path from "path";
import { predictDisease } from "./ml/inferenceEngine";

const ML_DIR = path.join(process.cwd(), "server", "ml");
const ONNX_MODEL = path.join(ML_DIR, "model_v2.onnx");
const METRICS_PATH = path.join(ML_DIR, "model_metrics.json");

console.log(`[ML] ONNX model path: ${ONNX_MODEL} — exists: ${fs.existsSync(ONNX_MODEL)}`);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  detect: router({
    modelStatus: publicProcedure.query(() => {
      const modelReady = fs.existsSync(ONNX_MODEL);
      const metricsReady = fs.existsSync(METRICS_PATH);
      return { modelReady, metricsReady };
    }),

    predict: publicProcedure
      .input(z.object({
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
        userId: z.string().optional(),
        location: z.string().optional(),
        saveToHistory: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        if (!fs.existsSync(ONNX_MODEL)) {
          return {
            success: false,
            error: "Model is still training. Please check back in a few minutes.",
            model_ready: false,
          };
        }

        const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const ext = input.mimeType.includes("png") ? "png" : "jpg";

        try {
          // Pure Node.js ONNX inference — no Python required
          const result = await predictDisease(buffer);
          if (!result.model_ready) return { success: false, error: result.error, model_ready: false };

          let imageUrl = "";
          let imageKey = "";
          let scanId: number | undefined;

          if (input.saveToHistory) {
            try {
              const fileKey = `scans/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
              const uploaded = await storagePut(fileKey, buffer, input.mimeType);
              imageUrl = uploaded.url;
              imageKey = uploaded.key;
              const scan = await createScan({
                userId: input.userId || null,
                imageUrl,
                imageKey,
                prediction: result.prediction as string,
                confidence: result.confidence as number,
                severity: (result.severity === "critical" ? "critical" : result.severity === "moderate" ? "warning" : "healthy") as "healthy" | "warning" | "critical",
                confidenceBreakdown: result.confidence_breakdown as Record<string, number>,
                location: input.location || null,
                synced: "synced",
              });
              scanId = scan?.id;
            } catch (err) {
              console.error("[Storage/DB] Failed to save scan:", err);
            }
          }

          return { success: true, model_ready: true, scanId, imageUrl, ...result };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[Inference] Error:", msg);
          throw new Error(`Inference failed: ${msg}`);
        }
      }),
  }),

  scans: router({
    list: publicProcedure
      .input(z.object({ userId: z.string().optional() }))
      .query(async ({ input }) => {
        if (input.userId) return getScansByUser(input.userId, 100);
        return getAllScans(100);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number(), userId: z.string().optional() }))
      .mutation(async ({ input }) => {
        return deleteScan(input.id, input.userId || "");
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getScanById(input.id)),
  }),

  metrics: router({
    get: publicProcedure.query(() => {
      if (!fs.existsSync(METRICS_PATH)) return null;
      try {
        return JSON.parse(fs.readFileSync(METRICS_PATH, "utf-8"));
      } catch { return null; }
    }),
  }),
});

export type AppRouter = typeof appRouter;
