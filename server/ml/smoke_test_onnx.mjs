/**
 * Smoke test for the pure Node.js ONNX inference engine.
 * Run with: node server/ml/smoke_test_onnx.mjs
 */
import { predictDisease } from "./inferenceEngine.js";
import sharp from "sharp";

async function main() {
  console.log("=== ONNX Inference Smoke Test ===\n");

  // Create a synthetic 224x224 green image (simulates a healthy leaf)
  const greenBuf = await sharp({
    create: { width: 224, height: 224, channels: 3, background: { r: 60, g: 140, b: 50 } }
  }).jpeg().toBuffer();

  console.log("Test 1: Green (healthy-looking) image");
  const r1 = await predictDisease(greenBuf);
  console.log(`  Prediction: ${r1.prediction} (${r1.confidence}% confidence)`);
  console.log(`  Breakdown:`, r1.confidence_breakdown);
  console.log(`  Regions: ${r1.region_count}\n`);

  // Create a brown-spotted image (simulates early blight)
  const brownBuf = await sharp({
    create: { width: 224, height: 224, channels: 3, background: { r: 110, g: 70, b: 30 } }
  }).jpeg().toBuffer();

  console.log("Test 2: Brown (blight-looking) image");
  const r2 = await predictDisease(brownBuf);
  console.log(`  Prediction: ${r2.prediction} (${r2.confidence}% confidence)`);
  console.log(`  Breakdown:`, r2.confidence_breakdown);
  console.log(`  Regions: ${r2.region_count}\n`);

  // Create a dark image (simulates late blight)
  const darkBuf = await sharp({
    create: { width: 224, height: 224, channels: 3, background: { r: 30, g: 20, b: 15 } }
  }).jpeg().toBuffer();

  console.log("Test 3: Dark (late blight-looking) image");
  const r3 = await predictDisease(darkBuf);
  console.log(`  Prediction: ${r3.prediction} (${r3.confidence}% confidence)`);
  console.log(`  Breakdown:`, r3.confidence_breakdown);
  console.log(`  Regions: ${r3.region_count}\n`);

  console.log("=== All smoke tests passed ===");
}

main().catch(e => {
  console.error("Smoke test FAILED:", e.message);
  process.exit(1);
});
