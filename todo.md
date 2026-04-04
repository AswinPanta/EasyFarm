# Potato Disease Detector — TODO

## Setup
- [x] Convert project from TypeScript to JavaScript (JSX)
- [x] Add Supabase client library
- [x] Add i18n translation library (react-i18next)
- [x] Configure Vite for plain JS/JSX (no TS)
- [x] Upload logo to CDN and set as app logo
- [x] Set up database schema (users, scans, model_metrics)
- [x] Push DB migrations

## Backend
- [x] Python CNN training script using PlantVillage dataset
- [x] Export trained model (.keras) and metrics JSON
- [x] Express route: POST /api/predict — accepts image, runs Python inference
- [x] tRPC route: scans.save — save scan result to DB
- [x] tRPC route: scans.list — list user scan history
- [x] tRPC route: scans.delete — delete a scan record
- [x] tRPC route: metrics.get — return model evaluation metrics
- [x] Upload predicted images to S3

## Frontend Pages
- [x] Landing page with hero, features overview, and CTA
- [x] Scanner page: drag-and-drop + file upload from gallery
- [x] Direct camera capture using device camera (getUserMedia / input capture)
- [x] Camera preview with capture button on mobile
- [x] Switch between camera and upload modes
- [x] Disease result card: color-coded (green/amber/red), confidence score, urgency
- [x] Disease info cards: treatment recommendations, action timelines
- [x] Scan history dashboard: list of past scans with thumbnails and classifications
- [x] Model evaluation dashboard: accuracy, precision, recall, F1-score, confidence chart
- [x] Offline status indicator bar (local vs cloud sync)
- [x] High-contrast mode toggle for outdoor sunlight readability

## Internationalization
- [x] Bilingual support: English and Nepali (नेपाली)
- [x] Language toggle button in header
- [x] All UI strings translated (disease names, recommendations, labels, navigation)
- [x] Nepali font (Noto Sans Devanagari) loaded via Google Fonts

## Authentication
- [x] Supabase Auth integration (email/password + social login)
- [x] Login / Register pages
- [x] Protected routes for scan history and dashboard
- [x] User profile display in header

## Design
- [x] Agricultural color palette (Deep Forest Green, Amber, Rust Red, Earthy Beige)
- [x] Mobile-first responsive layout
- [x] Literal iconography (potato leaf, tuber, pest icons)
- [x] 7:1 contrast ratio for critical information
- [x] App logo set in header and favicon

## Testing
- [x] Vitest unit tests for backend routes (7 tests passing)
- [x] Checkpoint and delivery

## Bug Fixes
- [x] Fix Python version mismatch (python3 → python3.11) in scan inference call
- [x] Fix PYTHONHOME/PYTHONPATH env conflict causing SRE module mismatch error
- [x] Verified full end-to-end scan pipeline works (Early Blight 100% confidence)

## Disease Region Highlighting (Lasso Overlay)
- [x] Python color segmentation to detect infected regions (brown/dark spots for Early Blight, dark lesions for Late Blight)
- [x] Output polygon/contour coordinates from predict.py alongside prediction
- [x] Canvas overlay on scan result image showing dotted lasso around infected areas
- [x] Color-coded: Amber dots for Early Blight regions, Red dots for Late Blight regions
- [x] Animated dashed border on infected regions
- [x] Farmer-friendly label: "Trim this area" / "यो भाग काट्नुहोस्"
- [x] Confidence-weighted region opacity
- [x] Background darkening to focus attention on infected zones
- [x] Vertex dots (white inner, color outer) on polygon corners
- [x] Region count badge in top-right corner
- [x] Bilingual destroy label for Late Blight: "DESTROY — Remove & burn immediately"
## Critical Bug Fixes
- [x] Diagnosed misclassification: custom CNN trained only on PlantVillage lab images fails on real-world field photos
- [x] Retrained with MobileNetV2 transfer learning + heavy augmentation (background blur, varied lighting, random crops, noise)
- [x] Real-world Late Blight image now correctly classified at 98.03% confidence
- [x] Updated predict.py to use best_model_v2.keras with MobileNetV2 preprocessing ([-1, 1] range)
- [x] Verified all three classes predict correctly on real-world images
- [x] All 9 vitest tests pass after fix

## Production Deployment Fix
- [x] Fix python3.11 not found in production container (/usr/src/app)
- [x] Migrated inference from Python subprocess to pure Node.js ONNX Runtime (onnxruntime-node + sharp)
- [x] Rewrote server/ml/inferenceEngine.ts — no Python, TensorFlow, or OpenCV required in production
- [x] Rewrote server/routers.ts detect.predict to use predictDisease() from inferenceEngine.ts
- [x] Disease region detection ported to pure JavaScript (HSL color segmentation + BFS flood fill)
- [x] All 12 vitest tests pass after migration (including new ONNX inference engine tests)
- [x] TypeScript compiles with no errors
- [x] Server starts and reports ONNX model ready
