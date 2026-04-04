import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as fs from "fs";
import * as path from "path";

// ── Helpers ────────────────────────────────────────────────────────────────────

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

// ── Supabase env vars ─────────────────────────────────────────────────────────

describe("Supabase environment variables", () => {
  it("VITE_SUPABASE_URL is set and is a valid Supabase URL", () => {
    const url = process.env.VITE_SUPABASE_URL;
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co/);
  });

  it("VITE_SUPABASE_ANON_KEY is set and non-empty", () => {
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    // Key may be a short test value in CI; just check it exists
    expect(key).toBeTruthy();
    expect(typeof key).toBe("string");
  });
});

// ── detect.modelStatus ────────────────────────────────────────────────────────

describe("detect.modelStatus", () => {
  it("returns modelReady and metricsReady as booleans", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const status = await caller.detect.modelStatus();
    expect(typeof status.modelReady).toBe("boolean");
    expect(typeof status.metricsReady).toBe("boolean");
  });

  it("ONNX model file exists at expected path", () => {
    const mlDir = path.join(process.cwd(), "server", "ml");
    const onnxModel = path.join(mlDir, "model_v2.onnx");
    expect(fs.existsSync(onnxModel)).toBe(true);
  });

  it("modelStatus returns modelReady=true when ONNX model exists", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const status = await caller.detect.modelStatus();
    // ONNX model is present in this environment
    expect(status.modelReady).toBe(true);
  });
});

// ── metrics.get ───────────────────────────────────────────────────────────────

describe("metrics.get", () => {
  it("returns null or a valid metrics object", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const metrics = await caller.metrics.get();
    if (metrics !== null) {
      // JSON uses 'overall' key (not 'overall_metrics')
      expect(metrics).toHaveProperty("overall");
      expect(typeof (metrics as any).overall.accuracy).toBe("number");
      expect(metrics).toHaveProperty("per_class");
      expect(metrics).toHaveProperty("model_info");
      expect(metrics).toHaveProperty("training_history");
    } else {
      expect(metrics).toBeNull();
    }
  });
});

// ── auth.logout ───────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "test", email: "t@t.com", name: "Test",
        loginMethod: "test", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string) => cleared.push(name) } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(cleared.length).toBe(1);
  });
});

// ── i18n translations ─────────────────────────────────────────────────────────

describe("i18n translation files", () => {
  it("i18n.js exists in client/src/lib", () => {
    const p = path.join(process.cwd(), "client", "src", "lib", "i18n.js");
    expect(fs.existsSync(p)).toBe(true);
  });
});

// ── ONNX inference engine ─────────────────────────────────────────────────────

describe("ONNX inference engine", () => {
  it("inferenceEngine.ts exists in server/ml", () => {
    const p = path.join(process.cwd(), "server", "ml", "inferenceEngine.ts");
    expect(fs.existsSync(p)).toBe(true);
  });

  it("ONNX model file is present and non-empty", () => {
    const p = path.join(process.cwd(), "server", "ml", "model_v2.onnx");
    expect(fs.existsSync(p)).toBe(true);
    const stat = fs.statSync(p);
    expect(stat.size).toBeGreaterThan(1_000_000); // at least 1 MB
  });

  it("predictDisease returns expected fields for a synthetic image", async () => {
    const { predictDisease } = await import("./ml/inferenceEngine");
    const sharp = (await import("sharp")).default;
    // Create a 224x224 synthetic green image
    const buf = await sharp({
      create: { width: 224, height: 224, channels: 3, background: { r: 60, g: 140, b: 50 } }
    }).jpeg().toBuffer();
    const result = await predictDisease(buf);
    expect(result.model_ready).toBe(true);
    expect(typeof result.prediction).toBe("string");
    expect(["Early Blight", "Healthy", "Late Blight"]).toContain(result.prediction);
    expect(typeof result.confidence).toBe("number");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.confidence_breakdown).toBeDefined();
    expect(Array.isArray(result.regions)).toBe(true);
    expect(typeof result.treatment).toBe("object");
    expect(typeof result.treatment_ne).toBe("object");
  });
});
