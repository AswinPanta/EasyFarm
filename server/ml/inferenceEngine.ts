/**
 * Pure Node.js inference engine using ONNX Runtime + Sharp.
 * No Python required — works in both dev sandbox and production container.
 */
import * as ort from "onnxruntime-node";
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const ML_DIR = path.join(process.cwd(), "server", "ml");
const ONNX_MODEL = path.join(ML_DIR, "model_v2.onnx");

const CLASS_NAMES = ["Early Blight", "Healthy", "Late Blight"];
const IMG_SIZE = 224;

// Disease metadata matching the Python predict.py structure
const DISEASE_INFO: Record<string, {
  label_ne: string;
  severity: string;
  urgency: string;
  urgency_ne: string;
  description: string;
  description_ne: string;
  treatment: string[];
  treatment_ne: string[];
  timeline: string;
  timeline_ne: string;
  color: string;
  icon: string;
  region_label: string;
  region_label_ne: string;
}> = {
  "Healthy": {
    label_ne: "स्वस्थ",
    severity: "none",
    urgency: "No action needed",
    urgency_ne: "कुनै कार्य आवश्यक छैन",
    description: "Your potato plant appears healthy. Continue regular monitoring and good agricultural practices.",
    description_ne: "तपाईंको आलुको बिरुवा स्वस्थ देखिन्छ। नियमित अनुगमन र राम्रो कृषि अभ्यास जारी राख्नुहोस्।",
    treatment: ["Continue regular watering schedule", "Apply balanced fertilizer as needed", "Monitor weekly for early signs of disease", "Ensure good air circulation between plants"],
    treatment_ne: ["नियमित सिँचाइ तालिका जारी राख्नुहोस्", "आवश्यकता अनुसार सन्तुलित मल प्रयोग गर्नुहोस्", "रोगको प्रारम्भिक संकेतहरूको लागि साप्ताहिक अनुगमन गर्नुहोस्", "बिरुवाहरू बीच राम्रो हावा प्रवाह सुनिश्चित गर्नुहोस्"],
    timeline: "No immediate action required",
    timeline_ne: "तत्काल कार्य आवश्यक छैन",
    color: "#16a34a",
    icon: "✅",
    region_label: "Healthy — No action needed",
    region_label_ne: "स्वस्थ — कुनै कार्य आवश्यक छैन",
  },
  "Early Blight": {
    label_ne: "अर्ली ब्लाइट",
    severity: "moderate",
    urgency: "Act within 3–5 days to prevent spread",
    urgency_ne: "फैलिन नदिन ३–५ दिनभित्र कार्य गर्नुहोस्",
    description: "Early Blight (Alternaria solani) causes dark brown spots with concentric rings on lower leaves.",
    description_ne: "अर्ली ब्लाइट (अल्टर्नेरिया सोलानी) ले तल्लो पातहरूमा केन्द्रित वलयहरू सहित गाढा खैरो दागहरू बनाउँछ।",
    treatment: ["Remove and destroy infected leaves immediately", "Apply copper-based fungicide (Mancozeb, Chlorothalonil)", "Avoid overhead irrigation to reduce leaf wetness", "Improve air circulation by pruning dense foliage", "Apply fungicide every 7–10 days during wet weather"],
    treatment_ne: ["संक्रमित पातहरू तुरुन्त हटाउनुहोस् र नष्ट गर्नुहोस्", "तामा-आधारित ढुसीनाशक (म्यान्कोजेब, क्लोरोथालोनिल) लगाउनुहोस्", "पातको ओसिलोपन कम गर्न माथिबाट सिँचाइ नगर्नुहोस्", "घना पातहरू काटेर हावा प्रवाह सुधार गर्नुहोस्", "ओसिलो मौसममा हरेक ७–१० दिनमा ढुसीनाशक लगाउनुहोस्"],
    timeline: "Can spread to entire plant in 1–2 weeks without treatment",
    timeline_ne: "उपचार बिना १–२ हप्तामा सम्पूर्ण बिरुवामा फैलिन सक्छ",
    color: "#d97706",
    icon: "⚠️",
    region_label: "✂ Trim / Remove this area",
    region_label_ne: "✂ यो भाग काट्नुहोस्",
  },
  "Late Blight": {
    label_ne: "लेट ब्लाइट",
    severity: "critical",
    urgency: "URGENT — Act within 24–48 hours to prevent complete crop loss",
    urgency_ne: "अत्यावश्यक — सम्पूर्ण बाली नोक्सानी रोक्न २४–४८ घण्टाभित्र कार्य गर्नुहोस्",
    description: "Late Blight (Phytophthora infestans) is the most destructive potato disease. It causes water-soaked lesions that rapidly turn brown-black.",
    description_ne: "लेट ब्लाइट (फाइटोफ्थोरा इन्फेस्टान्स) सबैभन्दा विनाशकारी आलुको रोग हो। यसले पानी-भिजेका घाउहरू बनाउँछ जुन छिट्टै खैरो-कालो हुन्छन्।",
    treatment: ["IMMEDIATELY isolate affected plants to prevent spread", "Apply systemic fungicide (Metalaxyl, Cymoxanil) within 24 hours", "Remove all infected plant material and bury or burn it", "Do NOT compost infected material", "Apply preventive fungicide to all neighboring plants", "Harvest healthy tubers immediately if infection is severe"],
    treatment_ne: ["फैलिन नदिन तुरुन्त प्रभावित बिरुवाहरू अलग गर्नुहोस्", "२४ घण्टाभित्र प्रणालीगत ढुसीनाशक (मेटालाक्सिल, साइमोक्सानिल) लगाउनुहोस्", "सबै संक्रमित बिरुवाको सामग्री हटाउनुहोस् र गाड्नुहोस् वा जलाउनुहोस्", "संक्रमित सामग्री कम्पोस्ट नगर्नुहोस्", "सबै छिमेकी बिरुवाहरूमा निवारक ढुसीनाशक लगाउनुहोस्", "संक्रमण गम्भीर भएमा तुरुन्त स्वस्थ कन्दहरू काट्नुहोस्"],
    timeline: "Can destroy entire crop in 2–3 days in wet conditions",
    timeline_ne: "ओसिलो अवस्थामा २–३ दिनमा सम्पूर्ण बाली नष्ट गर्न सक्छ",
    color: "#DC2626",
    icon: "🚨",
    region_label: "DESTROY — Remove & burn immediately",
    region_label_ne: "नष्ट गर्नुहोस् — तुरुन्त हटाउनुहोस् र जलाउनुहोस्",
  },
};

let _session: ort.InferenceSession | null = null;

async function getSession(): Promise<ort.InferenceSession> {
  if (!_session) {
    _session = await ort.InferenceSession.create(ONNX_MODEL);
  }
  return _session;
}

/**
 * Detect infected regions using color segmentation on the raw image buffer.
 * Returns normalized polygon coordinates [0..1].
 */
async function detectRegions(imageBuffer: Buffer, prediction: string): Promise<{
  points: number[][];
  bbox: { x: number; y: number; w: number; h: number };
  area_pct: number;
}[]> {
  if (prediction === "Healthy") return [];

  try {
    // Get image dimensions
    const meta = await sharp(imageBuffer).metadata();
    const W = meta.width || 224;
    const H = meta.height || 224;

    // Resize for segmentation
    const SEG_W = 256;
    const SEG_H = 256;
    const raw = await sharp(imageBuffer).resize(SEG_W, SEG_H).raw().toBuffer();

    // Scan pixels for disease-colored regions
    const mask = new Uint8Array(SEG_W * SEG_H);
    for (let i = 0; i < SEG_W * SEG_H; i++) {
      const r = raw[i * 3];
      const g = raw[i * 3 + 1];
      const b = raw[i * 3 + 2];

      // Convert to HSL
      const rn = r / 255, gn = g / 255, bn = b / 255;
      const max = Math.max(rn, gn, bn);
      const min = Math.min(rn, gn, bn);
      const l = (max + min) / 2;
      let s = 0, h = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
          case gn: h = ((bn - rn) / d + 2) / 6; break;
          case bn: h = ((rn - gn) / d + 4) / 6; break;
        }
      }
      const hDeg = h * 360;

      if (prediction === "Early Blight") {
        // Brown/dark spots: hue 15-45, low-medium saturation, low-medium lightness
        mask[i] = (hDeg >= 10 && hDeg <= 50 && s > 0.15 && l < 0.55 && l > 0.1) ? 1 : 0;
      } else {
        // Late Blight: dark water-soaked lesions — very dark pixels or dark brown
        mask[i] = (l < 0.35 && !(hDeg >= 90 && hDeg <= 160)) ? 1 : 0;
      }
    }

    // Simple connected component labeling (flood fill based)
    const regions: { points: number[][]; bbox: { x: number; y: number; w: number; h: number }; area_pct: number }[] = [];
    const visited = new Uint8Array(SEG_W * SEG_H);

    for (let startY = 0; startY < SEG_H; startY++) {
      for (let startX = 0; startX < SEG_W; startX++) {
        const startIdx = startY * SEG_W + startX;
        if (!mask[startIdx] || visited[startIdx]) continue;

        // BFS flood fill
        const pixels: [number, number][] = [];
        const queue: [number, number][] = [[startX, startY]];
        visited[startIdx] = 1;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          pixels.push([cx, cy]);
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || nx >= SEG_W || ny < 0 || ny >= SEG_H) continue;
            const ni = ny * SEG_W + nx;
            if (!mask[ni] || visited[ni]) continue;
            visited[ni] = 1;
            queue.push([nx, ny]);
          }
        }

        // Minimum area threshold (0.5% of image)
        if (pixels.length < SEG_W * SEG_H * 0.005) continue;

        // Compute bounding box
        let minX = SEG_W, maxX = 0, minY = SEG_H, maxY = 0;
        for (const [px, py] of pixels) {
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }

        // Sample boundary points for the polygon (simplified convex hull approximation)
        const bboxW = maxX - minX;
        const bboxH = maxY - minY;
        const points: number[][] = [];
        // Sample points along the bounding box perimeter with some jitter
        const steps = Math.min(12, Math.max(6, Math.floor(pixels.length / 50)));
        for (let s = 0; s < steps; s++) {
          const angle = (s / steps) * 2 * Math.PI;
          const rx = (bboxW / 2) * 0.85;
          const ry = (bboxH / 2) * 0.85;
          const cx = minX + bboxW / 2;
          const cy = minY + bboxH / 2;
          points.push([
            Math.min(1, Math.max(0, (cx + Math.cos(angle) * rx) / SEG_W)),
            Math.min(1, Math.max(0, (cy + Math.sin(angle) * ry) / SEG_H)),
          ]);
        }

        regions.push({
          points,
          bbox: {
            x: minX / SEG_W,
            y: minY / SEG_H,
            w: bboxW / SEG_W,
            h: bboxH / SEG_H,
          },
          area_pct: (pixels.length / (SEG_W * SEG_H)) * 100,
        });
      }
    }

    // Sort by area descending, return top 6
    return regions.sort((a, b) => b.area_pct - a.area_pct).slice(0, 6);
  } catch (err) {
    console.error("[InferenceEngine] Region detection failed:", err);
    return [];
  }
}

export async function predictDisease(imageBuffer: Buffer): Promise<Record<string, unknown>> {
  if (!fs.existsSync(ONNX_MODEL)) {
    return { error: "Model not found. Training may still be in progress.", model_ready: false };
  }

  const session = await getSession();

  // Preprocess: resize to 224x224, MobileNetV2 normalize to [-1, 1]
  const raw = await sharp(imageBuffer).resize(IMG_SIZE, IMG_SIZE).raw().toBuffer();
  const float32 = new Float32Array(IMG_SIZE * IMG_SIZE * 3);
  for (let i = 0; i < raw.length; i++) {
    float32[i] = (raw[i] / 127.5) - 1.0;
  }

  const tensor = new ort.Tensor("float32", float32, [1, IMG_SIZE, IMG_SIZE, 3]);
  const results = await session.run({ input: tensor });
  const output = Object.values(results)[0] as ort.Tensor;
  const probs = Array.from(output.data as Float32Array);

  const predIdx = probs.indexOf(Math.max(...probs));
  const predClass = CLASS_NAMES[predIdx];
  const confidence = probs[predIdx];

  const info = DISEASE_INFO[predClass];
  const regions = await detectRegions(imageBuffer, predClass);

  return {
    model_ready: true,
    prediction: predClass,
    prediction_ne: info.label_ne,
    confidence: parseFloat((confidence * 100).toFixed(2)),
    confidence_breakdown: {
      "Early Blight": parseFloat((probs[0] * 100).toFixed(2)),
      "Healthy": parseFloat((probs[1] * 100).toFixed(2)),
      "Late Blight": parseFloat((probs[2] * 100).toFixed(2)),
    },
    severity: info.severity,
    urgency: info.urgency,
    urgency_ne: info.urgency_ne,
    description: info.description,
    description_ne: info.description_ne,
    treatment: info.treatment,
    treatment_ne: info.treatment_ne,
    timeline: info.timeline,
    timeline_ne: info.timeline_ne,
    color: info.color,
    icon: info.icon,
    region_label: info.region_label,
    region_label_ne: info.region_label_ne,
    regions,
    region_count: regions.length,
  };
}
