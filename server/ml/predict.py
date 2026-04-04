"""
Potato Disease Inference Script with Region Segmentation
Usage: python3.11 predict.py <image_path>
Output: JSON with prediction results + infected region polygons for lasso overlay
"""

import sys
import json
import os
import warnings
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import numpy as np
import cv2

ML_DIR = os.path.dirname(os.path.abspath(__file__))
# Use MobileNetV2 model (v2) if available, fall back to v1
MODEL_PATH_V2 = os.path.join(ML_DIR, 'best_model_v2.keras')
MODEL_PATH_V1 = os.path.join(ML_DIR, 'best_model.keras')
MODEL_PATH = MODEL_PATH_V2 if os.path.exists(MODEL_PATH_V2) else MODEL_PATH_V1
USE_MOBILENET = os.path.exists(MODEL_PATH_V2)
IMG_SIZE = (224, 224) if USE_MOBILENET else (128, 128)

CLASS_NAMES = ["Early Blight", "Healthy", "Late Blight"]

# Disease info database
DISEASE_INFO = {
    "Early Blight": {
        "severity": "warning",
        "urgency": "Monitor closely — treat within 5–7 days",
        "urgency_ne": "नजिकबाट निगरानी गर्नुहोस् — ५–७ दिनभित्र उपचार गर्नुहोस्",
        "description": "Early Blight (Alternaria solani) causes dark brown spots with concentric rings on older leaves. It spreads in warm, humid conditions.",
        "description_ne": "अर्ली ब्लाइट (अल्टर्नेरिया सोलानी) ले पुराना पातहरूमा गाढा खैरो थोप्लाहरू बनाउँछ। यो तातो र आर्द्र अवस्थामा फैलिन्छ।",
        "treatment": [
            "Remove and destroy infected leaves immediately",
            "Apply copper-based fungicide (e.g., Mancozeb, Chlorothalonil)",
            "Improve air circulation between plants",
            "Avoid overhead irrigation; water at soil level",
            "Apply fungicide every 7–10 days during wet weather"
        ],
        "treatment_ne": [
            "संक्रमित पातहरू तुरुन्त हटाउनुहोस् र नष्ट गर्नुहोस्",
            "तामा-आधारित ढुसीनाशक (जस्तै म्यान्कोजेब, क्लोरोथालोनिल) प्रयोग गर्नुहोस्",
            "बिरुवाहरू बीच हावा प्रवाह सुधार गर्नुहोस्",
            "माथिबाट सिँचाइ नगर्नुहोस्; माटोको स्तरमा पानी दिनुहोस्",
            "ओसिलो मौसममा हरेक ७–१० दिनमा ढुसीनाशक लगाउनुहोस्"
        ],
        "timeline": "Crop loss risk in 2–3 weeks without treatment",
        "timeline_ne": "उपचार नगरी २–३ हप्तामा बाली नोक्सानीको जोखिम",
        "color": "#D97706",
        "icon": "⚠️",
        "region_label": "Trim / Remove this area",
        "region_label_ne": "यो भाग काट्नुहोस् / हटाउनुहोस्"
    },
    "Late Blight": {
        "severity": "critical",
        "urgency": "URGENT — Act within 24–48 hours to prevent total crop loss",
        "urgency_ne": "अत्यावश्यक — पूर्ण बाली नोक्सानी रोक्न २४–४८ घण्टाभित्र कार्य गर्नुहोस्",
        "description": "Late Blight (Phytophthora infestans) is the most destructive potato disease. It causes water-soaked lesions that rapidly turn brown-black.",
        "description_ne": "लेट ब्लाइट (फाइटोफ्थोरा इन्फेस्टान्स) सबैभन्दा विनाशकारी आलुको रोग हो। यसले पानी-भिजेका घाउहरू बनाउँछ जुन छिट्टै खैरो-कालो हुन्छन्।",
        "treatment": [
            "IMMEDIATELY isolate affected plants to prevent spread",
            "Apply systemic fungicide (Metalaxyl, Cymoxanil) within 24 hours",
            "Remove all infected plant material and bury or burn it",
            "Do NOT compost infected material",
            "Apply preventive fungicide to all neighboring plants",
            "Harvest healthy tubers immediately if infection is severe"
        ],
        "treatment_ne": [
            "फैलिन नदिन तुरुन्त प्रभावित बिरुवाहरू अलग गर्नुहोस्",
            "२४ घण्टाभित्र प्रणालीगत ढुसीनाशक (मेटालाक्सिल, साइमोक्सानिल) लगाउनुहोस्",
            "सबै संक्रमित बिरुवाको सामग्री हटाउनुहोस् र गाड्नुहोस् वा जलाउनुहोस्",
            "संक्रमित सामग्री कम्पोस्ट नगर्नुहोस्",
            "सबै छिमेकी बिरुवाहरूमा निवारक ढुसीनाशक लगाउनुहोस्",
            "संक्रमण गम्भीर भएमा तुरुन्त स्वस्थ कन्दहरू काट्नुहोस्"
        ],
        "timeline": "Can destroy entire crop in 2–3 days in wet conditions",
        "timeline_ne": "ओसिलो अवस्थामा २–३ दिनमा सम्पूर्ण बाली नष्ट गर्न सक्छ",
        "color": "#DC2626",
        "icon": "🚨",
        "region_label": "DESTROY — Remove & burn immediately",
        "region_label_ne": "नष्ट गर्नुहोस् — तुरुन्त हटाउनुहोस् र जलाउनुहोस्"
    },
    "Healthy": {
        "severity": "healthy",
        "urgency": "No action required — plant is healthy",
        "urgency_ne": "कुनै कार्य आवश्यक छैन — बिरुवा स्वस्थ छ",
        "description": "Your potato plant appears healthy with no visible signs of disease. Continue regular monitoring and preventive care.",
        "description_ne": "तपाईंको आलुको बिरुवा स्वस्थ देखिन्छ, रोगको कुनै दृश्यमान संकेत छैन। नियमित निगरानी र निवारक हेरचाह जारी राख्नुहोस्।",
        "treatment": [
            "Continue regular watering and fertilization schedule",
            "Apply preventive fungicide spray every 2–3 weeks",
            "Monitor weekly for early signs of disease",
            "Ensure proper drainage to prevent waterlogging",
            "Maintain plant spacing for good air circulation"
        ],
        "treatment_ne": [
            "नियमित सिँचाइ र मलखाद तालिका जारी राख्नुहोस्",
            "हरेक २–३ हप्तामा निवारक ढुसीनाशक स्प्रे लगाउनुहोस्",
            "रोगको प्रारम्भिक संकेतको लागि साप्ताहिक निगरानी गर्नुहोस्",
            "जलभराव रोक्न उचित निकासी सुनिश्चित गर्नुहोस्",
            "राम्रो हावा प्रवाहको लागि बिरुवाको दूरी कायम राख्नुहोस्"
        ],
        "timeline": "Keep monitoring every 3–5 days",
        "timeline_ne": "हरेक ३–५ दिनमा निगरानी जारी राख्नुहोस्",
        "color": "#16A34A",
        "icon": "✅",
        "region_label": "",
        "region_label_ne": ""
    }
}


def segment_disease_regions(image_path, disease):
    """
    Detect infected regions using color segmentation in HSV + LAB color spaces.
    Returns list of polygon contours as relative (0-1) coordinates.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        return []

    work_w, work_h = 512, 512
    img_resized = cv2.resize(img_bgr, (work_w, work_h))
    img_hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
    img_lab = cv2.cvtColor(img_resized, cv2.COLOR_BGR2LAB)

    mask = None

    if disease == "Early Blight":
        # Brown/tan circular spots — warm hues, mid-dark value
        lower1 = np.array([5,  50,  40])
        upper1 = np.array([25, 255, 200])
        mask1  = cv2.inRange(img_hsv, lower1, upper1)

        # Darker brown necrotic centers
        lower2 = np.array([0,  30,  20])
        upper2 = np.array([15, 255, 150])
        mask2  = cv2.inRange(img_hsv, lower2, upper2)

        # LAB: high A channel = reddish-brown tissue
        l_ch, a_ch, b_ch = cv2.split(img_lab)
        mask3 = cv2.inRange(a_ch, np.array([138]), np.array([180]))

        mask = cv2.bitwise_or(mask1, mask2)
        mask = cv2.bitwise_or(mask, mask3)

    elif disease == "Late Blight":
        # Dark water-soaked lesions — low value, low-mid saturation
        lower1 = np.array([0,   0,  10])
        upper1 = np.array([180, 130, 110])
        mask1  = cv2.inRange(img_hsv, lower1, upper1)

        # Dark olive/gray necrotic tissue
        lower2 = np.array([20, 0,  20])
        upper2 = np.array([80, 90, 100])
        mask2  = cv2.inRange(img_hsv, lower2, upper2)

        # LAB: very dark (low L)
        l_ch, a_ch, b_ch = cv2.split(img_lab)
        mask3 = cv2.inRange(l_ch, np.array([0]), np.array([85]))

        mask = cv2.bitwise_or(mask1, mask2)
        mask = cv2.bitwise_or(mask, mask3)

    else:
        return []

    # Morphological cleanup — close gaps, remove noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel, iterations=1)
    mask = cv2.dilate(mask, kernel, iterations=1)

    # Remove solid green (healthy leaf) areas from the mask
    green_mask = cv2.inRange(img_hsv, np.array([35, 50, 50]), np.array([90, 255, 255]))
    green_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
    green_eroded = cv2.erode(green_mask, green_kernel, iterations=3)
    mask = cv2.bitwise_and(mask, cv2.bitwise_not(green_eroded))

    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return []

    # Keep only significant regions (> 0.4% of image area)
    min_area = work_w * work_h * 0.004
    significant = [c for c in contours if cv2.contourArea(c) > min_area]
    if not significant:
        return []

    # Sort by area, keep top 6
    significant = sorted(significant, key=cv2.contourArea, reverse=True)[:6]

    regions = []
    for contour in significant:
        area = cv2.contourArea(contour)
        # Simplify polygon
        epsilon = 0.025 * cv2.arcLength(contour, True)
        approx  = cv2.approxPolyDP(contour, epsilon, True)

        if len(approx) < 3:
            x, y, w, h = cv2.boundingRect(contour)
            approx = np.array([[[x, y]], [[x+w, y]], [[x+w, y+h]], [[x, y+h]]])

        # Relative coords
        points = [[round(float(pt[0][0]) / work_w, 4),
                   round(float(pt[0][1]) / work_h, 4)] for pt in approx]

        x, y, w, h = cv2.boundingRect(contour)
        bbox = {
            "x": round(float(x) / work_w, 4),
            "y": round(float(y) / work_h, 4),
            "w": round(float(w) / work_w, 4),
            "h": round(float(h) / work_h, 4),
        }

        regions.append({
            "points":   points,
            "bbox":     bbox,
            "area_pct": round(area / (work_w * work_h) * 100, 2),
        })

    return regions


def predict(image_path):
    import tensorflow as tf

    if not os.path.exists(MODEL_PATH):
        return {"error": "Model not found. Training may still be in progress.", "model_ready": False}

    model = tf.keras.models.load_model(MODEL_PATH)

    img = tf.io.read_file(image_path)
    img = tf.image.decode_image(img, channels=3, expand_animations=False)
    img = tf.image.resize(img, IMG_SIZE)
    img = tf.cast(img, tf.float32)
    if USE_MOBILENET:
        # MobileNetV2 expects input in [-1, 1] range
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        img = preprocess_input(img)
    else:
        img = img / 255.0
    img = tf.expand_dims(img, 0)

    probs = model.predict(img, verbose=0)[0]
    pred_idx   = int(np.argmax(probs))
    pred_class = CLASS_NAMES[pred_idx]
    confidence = float(probs[pred_idx])

    confidence_breakdown = {
        CLASS_NAMES[i]: round(float(probs[i]) * 100, 2)
        for i in range(len(CLASS_NAMES))
    }

    info = DISEASE_INFO[pred_class]

    # Run region segmentation
    regions = segment_disease_regions(image_path, pred_class)

    result = {
        "model_ready": True,
        "prediction": pred_class,
        "confidence": round(confidence * 100, 2),
        "confidence_breakdown": confidence_breakdown,
        "severity": info["severity"],
        "urgency": info["urgency"],
        "urgency_ne": info["urgency_ne"],
        "description": info["description"],
        "description_ne": info["description_ne"],
        "treatment": info["treatment"],
        "treatment_ne": info["treatment_ne"],
        "timeline": info["timeline"],
        "timeline_ne": info["timeline_ne"],
        "color": info["color"],
        "icon": info["icon"],
        "region_label": info["region_label"],
        "region_label_ne": info["region_label_ne"],
        "regions": regions,
        "region_count": len(regions),
    }
    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image not found: {image_path}"}))
        sys.exit(1)
    result = predict(image_path)
    print(json.dumps(result))
