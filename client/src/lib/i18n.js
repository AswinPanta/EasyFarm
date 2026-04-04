import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // App
      appName: "PotatoDoc",
      appTagline: "AI-Powered Potato Disease Detection",
      
      // Navigation
      home: "Home",
      scan: "Scan",
      history: "History",
      metrics: "Model Metrics",
      login: "Login",
      logout: "Logout",
      register: "Register",
      
      // Landing
      heroTitle: "Protect Your Potato Crop",
      heroSubtitle: "Detect Early Blight, Late Blight, and Healthy plants instantly using AI — right from your phone.",
      startScanning: "Start Scanning",
      learnMore: "Learn More",
      feature1Title: "Instant Detection",
      feature1Desc: "Upload or capture a leaf photo and get results in seconds.",
      feature2Title: "Treatment Advice",
      feature2Desc: "Get actionable treatment recommendations for each disease.",
      feature3Title: "Scan History",
      feature3Desc: "Track all your past scans with timestamps and results.",
      feature4Title: "Works Offline",
      feature4Desc: "Scan results are saved locally when you're offline.",
      
      // Scanner
      scanTitle: "Scan Potato Leaf",
      uploadPhoto: "Upload Photo",
      takePhoto: "Take Photo",
      dragDrop: "Drag & drop a leaf photo here",
      orClick: "or click to browse",
      analyzing: "Analyzing leaf...",
      analyzeButton: "Analyze Disease",
      retake: "Scan Another",
      saveToHistory: "Save to History",
      
      // Results
      result: "Detection Result",
      confidence: "Confidence",
      severity: "Severity",
      treatment: "Treatment Steps",
      timeline: "Action Timeline",
      urgency: "Urgency",
      confidenceBreakdown: "Confidence Breakdown",
      
      // Diseases
      "Early Blight": "Early Blight",
      "Late Blight": "Late Blight",
      "Healthy": "Healthy",
      
      // Severity
      healthy: "Healthy",
      warning: "Warning",
      critical: "Critical",
      
      // History
      historyTitle: "Scan History",
      noHistory: "No scans yet. Start by scanning a leaf!",
      deleteScan: "Delete",
      scanDate: "Scan Date",
      location: "Location",
      
      // Metrics
      metricsTitle: "Model Performance",
      accuracy: "Accuracy",
      precision: "Precision",
      recall: "Recall",
      f1Score: "F1 Score",
      trainingHistory: "Training History",
      confusionMatrix: "Confusion Matrix",
      perClassMetrics: "Per-Class Metrics",
      datasetInfo: "Dataset Information",
      modelInfo: "Model Information",
      metricsNotReady: "Model metrics not available yet. Training may still be in progress.",
      
      // Status
      modelReady: "Model Ready",
      modelTraining: "Model Training...",
      synced: "Synced",
      savedLocally: "Saved Locally",
      online: "Online",
      offline: "Offline",
      
      // Auth
      emailLabel: "Email",
      passwordLabel: "Password",
      nameLabel: "Full Name",
      loginButton: "Sign In",
      registerButton: "Create Account",
      forgotPassword: "Forgot Password?",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      loginSuccess: "Welcome back!",
      logoutSuccess: "Logged out successfully",
      
      // Errors
      errorOccurred: "An error occurred",
      tryAgain: "Try Again",
      imageRequired: "Please select an image first",
      
      // Misc
      loading: "Loading...",
      close: "Close",
      back: "Back",
      support: "Support",
      totalScans: "Total Scans",
      lastScan: "Last Scan",
      healthyCount: "Healthy",
      blightCount: "Diseased",
    }
  },
  ne: {
    translation: {
      // App
      appName: "पोटाटोडक",
      appTagline: "AI-आधारित आलु रोग पहिचान",
      
      // Navigation
      home: "गृहपृष्ठ",
      scan: "स्क्यान",
      history: "इतिहास",
      metrics: "मोडेल मेट्रिक्स",
      login: "लग इन",
      logout: "लग आउट",
      register: "दर्ता",
      
      // Landing
      heroTitle: "आफ्नो आलुको बाली बचाउनुहोस्",
      heroSubtitle: "AI प्रयोग गरेर अर्ली ब्लाइट, लेट ब्लाइट र स्वस्थ बिरुवाहरू तुरुन्त पहिचान गर्नुहोस् — आफ्नो फोनबाटै।",
      startScanning: "स्क्यान सुरु गर्नुहोस्",
      learnMore: "थप जान्नुहोस्",
      feature1Title: "तत्काल पहिचान",
      feature1Desc: "पातको फोटो अपलोड गर्नुहोस् र सेकेन्डमा नतिजा पाउनुहोस्।",
      feature2Title: "उपचार सल्लाह",
      feature2Desc: "प्रत्येक रोगको लागि कार्यान्वयन योग्य उपचार सिफारिसहरू पाउनुहोस्।",
      feature3Title: "स्क्यान इतिहास",
      feature3Desc: "समय र नतिजाहरू सहित आफ्ना सबै पुराना स्क्यानहरू ट्र्याक गर्नुहोस्।",
      feature4Title: "अफलाइन काम गर्छ",
      feature4Desc: "अफलाइन हुँदा स्क्यान नतिजाहरू स्थानीय रूपमा सुरक्षित हुन्छन्।",
      
      // Scanner
      scanTitle: "आलुको पात स्क्यान गर्नुहोस्",
      uploadPhoto: "फोटो अपलोड",
      takePhoto: "फोटो खिच्नुहोस्",
      dragDrop: "यहाँ पातको फोटो तान्नुहोस्",
      orClick: "वा ब्राउज गर्न क्लिक गर्नुहोस्",
      analyzing: "पात विश्लेषण गर्दै...",
      analyzeButton: "रोग विश्लेषण गर्नुहोस्",
      retake: "अर्को स्क्यान",
      saveToHistory: "इतिहासमा सुरक्षित",
      
      // Results
      result: "पहिचान नतिजा",
      confidence: "विश्वास स्तर",
      severity: "गम्भीरता",
      treatment: "उपचार चरणहरू",
      timeline: "कार्य समयरेखा",
      urgency: "अत्यावश्यकता",
      confidenceBreakdown: "विश्वास विवरण",
      
      // Diseases
      "Early Blight": "अर्ली ब्लाइट",
      "Late Blight": "लेट ब्लाइट",
      "Healthy": "स्वस्थ",
      
      // Severity
      healthy: "स्वस्थ",
      warning: "सावधानी",
      critical: "गम्भीर",
      
      // History
      historyTitle: "स्क्यान इतिहास",
      noHistory: "अहिलेसम्म कुनै स्क्यान छैन। पात स्क्यान गरेर सुरु गर्नुहोस्!",
      deleteScan: "मेट्नुहोस्",
      scanDate: "स्क्यान मिति",
      location: "स्थान",
      
      // Metrics
      metricsTitle: "मोडेल प्रदर्शन",
      accuracy: "शुद्धता",
      precision: "परिशुद्धता",
      recall: "रिकल",
      f1Score: "F1 स्कोर",
      trainingHistory: "प्रशिक्षण इतिहास",
      confusionMatrix: "भ्रम म्याट्रिक्स",
      perClassMetrics: "प्रति-वर्ग मेट्रिक्स",
      datasetInfo: "डेटासेट जानकारी",
      modelInfo: "मोडेल जानकारी",
      metricsNotReady: "मोडेल मेट्रिक्स अहिले उपलब्ध छैन। प्रशिक्षण अझै जारी हुन सक्छ।",
      
      // Status
      modelReady: "मोडेल तयार",
      modelTraining: "मोडेल प्रशिक्षण...",
      synced: "सिंक भयो",
      savedLocally: "स्थानीय रूपमा सुरक्षित",
      online: "अनलाइन",
      offline: "अफलाइन",
      
      // Auth
      emailLabel: "इमेल",
      passwordLabel: "पासवर्ड",
      nameLabel: "पूरा नाम",
      loginButton: "साइन इन",
      registerButton: "खाता बनाउनुहोस्",
      forgotPassword: "पासवर्ड बिर्सनुभयो?",
      noAccount: "खाता छैन?",
      haveAccount: "पहिले नै खाता छ?",
      loginSuccess: "स्वागत छ!",
      logoutSuccess: "सफलतापूर्वक लग आउट भयो",
      
      // Errors
      errorOccurred: "त्रुटि भयो",
      tryAgain: "पुनः प्रयास गर्नुहोस्",
      imageRequired: "कृपया पहिले तस्वीर छान्नुहोस्",
      
      // Misc
      loading: "लोड हुँदैछ...",
      close: "बन्द",
      back: "पछाडि",
      support: "सहयोग",
      totalScans: "कुल स्क्यान",
      lastScan: "अन्तिम स्क्यान",
      healthyCount: "स्वस्थ",
      blightCount: "रोगग्रस्त",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("lang") || "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
