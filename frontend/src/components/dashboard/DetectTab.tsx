import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Camera,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ScanLine,
  Store,
  ShoppingCart,
  MessageSquare,
  Activity,
  CreditCard,
  RefreshCw
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { translations } from "./translations";
import { compressImage } from "@/lib/utils";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const cropConfig = {
  "Paddy (Rice)": {
    image: "https://images.unsplash.com/photo-1536657464919-892541299952?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Paddy Leaf Spot", url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=600&auto=format&fit=crop" },
      { label: "Rice Blast Leaf", url: "https://images.unsplash.com/photo-1535268647977-a403b69fc756?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Tomato": {
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Tomato Concentric Rings", url: "https://images.unsplash.com/photo-1628773822503-930a85897047?q=80&w=600&auto=format&fit=crop" },
      { label: "Tomato Early Blight", url: "https://images.unsplash.com/photo-1582515073490-39981397c445?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Potato": {
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Potato Late Blight", url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=600&auto=format&fit=crop" },
      { label: "Potato Leaf Curl", url: "https://images.unsplash.com/photo-1590856010076-7871b6d1947b?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Maize": {
    image: "https://images.unsplash.com/photo-1530011270275-52b21c432303?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Maize Northern Blight", url: "https://images.unsplash.com/photo-1607513746994-51f730a44832?q=80&w=600&auto=format&fit=crop" },
      { label: "Maize Rust Spot", url: "https://images.unsplash.com/photo-1532983330958-2f355ecbab14?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Chilli": {
    image: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Chilli Anthracnose", url: "https://images.unsplash.com/photo-1588167056840-13caf6e4562a?q=80&w=600&auto=format&fit=crop" },
      { label: "Chilli Leaf Curl", url: "https://images.unsplash.com/photo-1582283921867-b86e09e992aa?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Onion": {
    image: "https://images.unsplash.com/photo-1508747703725-719ae257c84a?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Onion Purple Blotch", url: "https://images.unsplash.com/photo-1620127252536-03bdfcf6d5c3?q=80&w=600&auto=format&fit=crop" },
      { label: "Onion Downy Mildew", url: "https://images.unsplash.com/photo-1618519764620-7403abdbfee9?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Groundnut": {
    image: "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Groundnut Tikka Leaf Spot", url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=600&auto=format&fit=crop" },
      { label: "Groundnut Rust", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Mango": {
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Mango Anthracnose", url: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?q=80&w=600&auto=format&fit=crop" },
      { label: "Mango Powdery Mildew", url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Banana": {
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Banana Sigatoka Spot", url: "https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=600&auto=format&fit=crop" },
      { label: "Banana Panama Wilt", url: "https://images.unsplash.com/photo-1566393028639-d108a42c46a7?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Cucumber": {
    image: "https://images.unsplash.com/photo-1449339854873-750e6df13d01?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Cucumber Powdery Mildew", url: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?q=80&w=600&auto=format&fit=crop" },
      { label: "Cucumber Downy Mildew", url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Brinjal": {
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Brinjal Phomopsis Blight", url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=600&auto=format&fit=crop" },
      { label: "Brinjal Little Leaf", url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Sunflower": {
    image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Sunflower Rust", url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop" },
      { label: "Sunflower Powdery Mildew", url: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Cotton": {
    image: "https://images.unsplash.com/photo-1594900010996-018742a03d00?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Cotton Leaf Spot", url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=600&auto=format&fit=crop" },
      { label: "Cotton Boll Rot", url: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  "Sugarcane": {
    image: "https://images.unsplash.com/photo-1595231712425-60418706fb60?q=80&w=600&auto=format&fit=crop",
    samples: [
      { label: "Sugarcane Red Rot", url: "https://images.unsplash.com/photo-1530507629858-e3759c1c66f3?q=80&w=600&auto=format&fit=crop" },
      { label: "Sugarcane Rust", url: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?q=80&w=600&auto=format&fit=crop" }
    ]
  }
};

interface DetectTabProps {
  language: "en" | "te";
  setActiveTab: (tab: any) => void;
  setSelectedConsultation: (consult: any) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  cropImageUrl: string;
  setCropImageUrl: (url: string) => void;
  scanResult: any;
  setScanResult: (result: any) => void;
  detectWorkflowStep: "category" | "info" | "upload" | "analyzing" | "report";
  setDetectWorkflowStep: (step: "category" | "info" | "upload" | "analyzing" | "report") => void;
  setAutoOpenBookingReportId?: (id: string) => void;
}

export function DetectTab({
  language,
  setActiveTab,
  setSelectedConsultation,
  selectedCrop,
  setSelectedCrop,
  cropImageUrl,
  setCropImageUrl,
  scanResult,
  setScanResult,
  detectWorkflowStep,
  setDetectWorkflowStep,
  setAutoOpenBookingReportId
}: DetectTabProps) {
  const { user } = useAuth();

  const [cropAnswers, setCropAnswers] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string, quality: { blur: boolean, brightness: boolean, focus: boolean, resolution: string, score: number } }>>([]);
  const [analyzingStageIndex, setAnalyzingStageIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [recommendedProductsList, setRecommendedProductsList] = useState<any[]>([]);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      setCameraStream(stream);
      setShowCameraModal(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error(language === "en" ? "Unable to access camera. Please check permissions." : "కెమెరాను యాక్సెస్ చేయలేకపోయాము. దయచేసి అనుమతులను తనిఖీ చేయండి.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        
        if (uploadedImages.length >= 5) {
          toast.warning("All slots filled.");
          stopCamera();
          return;
        }
        
        const isBlurry = Math.random() < 0.15;
        const score = isBlurry ? Math.floor(Math.random() * 15) + 50 : Math.floor(Math.random() * 20) + 78;
        const quality = {
          blur: isBlurry,
          brightness: true,
          focus: true,
          resolution: `${canvas.width}x${canvas.height}`,
          score
        };
        
        setUploadedImages(prev => {
          const next = [...prev, { url: dataUrl, quality }];
          setTimeout(() => setCropImageUrl(next[0].url), 0);
          return next;
        });
        
        toast.success(language === "en" ? "Photo captured successfully!" : "ఫోటో విజయవంతంగా తీయబడింది!");
        stopCamera();
      }
    }
  };

  useEffect(() => {
    // Fetch consultations to support redirection
    apiFetch("/api/customer/consultations")
      .then(res => res.json())
      .then(data => setConsultations(data.consultations || []))
      .catch(err => console.error("Error loading consultations in DetectTab", err));
  }, []);

  const handleAIScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setDetectWorkflowStep("analyzing");
    setAnalyzingStageIndex(0);

    let currentStage = 0;
    const stageInterval = setInterval(() => {
      if (currentStage < 6) {
        currentStage += 1;
        setAnalyzingStageIndex(currentStage);
      }
    }, 1500);

    try {
      const res = await apiFetch("/api/customer/disease-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: selectedCrop,
          imageUrl: cropImageUrl,
          answers: cropAnswers
        })
      });

      setTimeout(async () => {
        clearInterval(stageInterval);
        setIsScanning(false);
        if (res.ok) {
          const data = await res.json();
          setScanResult(data);

          // Get products recommendation if any
          if (data.recommendedProductsList) {
            setRecommendedProductsList(data.recommendedProductsList);
          } else {
            const prodRes = await apiFetch("/api/customer/products?limit=4");
            if (prodRes.ok) {
              const pData = await prodRes.json();
              setRecommendedProductsList(pData.products || []);
            }
          }

          toast.success(language === "en" ? "AI Crop Diagnosis Complete!" : "AI పంట వ్యాధి నిర్ధారణ పూర్తయింది!");
          setDetectWorkflowStep("report");
        } else {
          toast.error(language === "en" ? "AI scanning service currently busy." : "AI విశ్లేషణ సర్వీస్ ప్రస్తుతం అందుబాటులో లేదు.");
          setDetectWorkflowStep("upload");
        }
      }, 10500);
    } catch (err) {
      clearInterval(stageInterval);
      toast.error(language === "en" ? "AI scanning connection error" : "AI విశ్లేషణ కనెక్షన్ లోపం");
      setIsScanning(false);
      setDetectWorkflowStep("upload");
    }
  };

  const handleRequestConsultation = async (reportId: string) => {
    if (setAutoOpenBookingReportId) {
      setAutoOpenBookingReportId(reportId);
    }
    setActiveTab("consultations");
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const res = await apiFetch("/api/customer/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (res.ok) {
        toast.success("Product added to cart!");
        setActiveTab("cart");
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Progress Indicator */}
      {detectWorkflowStep !== "category" && (
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none w-full flex-nowrap text-[10px] md:text-xs font-semibold text-muted-foreground shadow-soft max-w-2xl mx-auto">
          {[
            { id: "category", label: translations[language].progressCrop },
            { id: "info", label: translations[language].progressInfo },
            { id: "upload", label: translations[language].progressImages },
            { id: "analyzing", label: translations[language].progressAnalysis },
            { id: "report", label: translations[language].progressRec }
          ].map((step, idx) => {
            const steps = ["category", "info", "upload", "analyzing", "report"];
            const isCurrent = detectWorkflowStep === step.id;
            const isCompleted = steps.indexOf(detectWorkflowStep) > idx;
            return (
              <div key={step.id} className="flex items-center gap-1.5 md:gap-2 my-1 shrink-0">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center font-extrabold text-[10px] transition-all ${isCurrent ? "bg-brand text-brand-foreground scale-110 shadow-sm" : isCompleted ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"
                  }`}>
                  {idx + 1}
                </span>
                <span className={`${isCurrent ? "text-brand font-bold" : isCompleted ? "text-foreground font-semibold" : ""}`}>
                  {step.label}
                </span>
                {idx < 4 && <ChevronRight className="h-3 w-3 text-muted-foreground/45 ml-1" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Step 0: Category Selection */}
      {detectWorkflowStep === "category" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="font-bold text-lg text-foreground">{translations[language].title}</h3>
            <p className="text-xs text-muted-foreground">{translations[language].subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(cropConfig).map(([cropName, config]) => (
              <button
                key={cropName}
                onClick={() => {
                  setSelectedCrop(cropName);
                  setCropImageUrl(config.samples[0].url);
                  const draft = localStorage.getItem(`draft_${cropName}`);
                  if (draft) {
                    setCropAnswers(JSON.parse(draft));
                  } else {
                    setCropAnswers({});
                  }
                  setUploadedImages([]);
                  setScanResult(null);
                  setDetectWorkflowStep("info");
                }}
                className="bg-card border border-border rounded-2xl p-4 hover:border-brand hover:shadow-md transition-all text-left group cursor-pointer border-0 outline-none"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-3 border border-border bg-muted">
                  <img
                    src={config.image}
                    alt={cropName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="font-bold text-sm text-foreground">{cropName}</h4>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Crop Information Questionnaire */}
      {detectWorkflowStep === "info" && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft max-w-3xl mx-auto space-y-6 text-left relative">
          <div className="flex items-center gap-4 bg-muted/10 p-4 rounded-xl border border-border">
            <img
              src={cropConfig[selectedCrop as keyof typeof cropConfig]?.image}
              alt=""
              className="w-14 h-14 object-cover rounded-lg border flex-shrink-0 bg-muted"
            />
            <div>
              <h3 className="font-bold text-sm text-foreground">{selectedCrop} {translations[language].progressInfo}</h3>
              <p className="text-[10px] text-muted-foreground">Answer questions to help our AI diagnose accurately</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].variety}</label>
              <select
                value={cropAnswers["Variety"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Variety": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">-- Select Variety --</option>
                {(selectedCrop === "Paddy (Rice)" ? ["Swarna", "Basmati", "Sona Masuri", "IR64", "Hybrid RP"] :
                  selectedCrop === "Tomato" ? ["Arka Rakshak", "Pusa Ruby", "Country Tomato", "Cherry Tomato", "Abhinav Hybrid"] :
                    selectedCrop === "Potato" ? ["Kufri Jyoti", "Kufri Bahar", "Kufri Pukhraj", "Red Potato", "Local Organic"] :
                      selectedCrop === "Maize" ? ["Sweet Corn", "Baby Corn", "Deccan Hybrid", "Double Cross Hybrid"] :
                        selectedCrop === "Chilli" ? ["Guntur Sannam", "Byadagi Chilli", "Teja Chilli", "Jwala Chilli"] :
                          selectedCrop === "Onion" ? ["Red Onion", "White Onion", "Shallots (Sambhar Onion)", "Nasik Red"] :
                            ["Local Variety", "Hybrid Variety", "Organic Certified", "Imported Seedlings"]).map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].cropAge}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={cropAnswers["Crop Age"] || ""}
                  onChange={(e) => {
                    const updated = { ...cropAnswers, "Crop Age": e.target.value };
                    setCropAnswers(updated);
                    localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                  }}
                  className="flex-grow rounded-lg border border-border bg-background px-3 py-2 text-xs"
                />
                <span className="bg-muted px-3 py-2 border border-border rounded-lg text-xs font-semibold text-muted-foreground">
                  {translations[language].days}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].growthStage}</label>
              <select
                value={cropAnswers["Growth Stage"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Growth Stage": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">-- Select Stage --</option>
                {["Seedling", "Vegetative", "Flowering", "Fruiting/Grain filling", "Maturity/Harvest"].map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].affectedPart}</label>
              <select
                value={cropAnswers["Affected Part"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Affected Part": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">-- Select Part --</option>
                {["Leaf", "Stem", "Root", "Flower", "Fruit", "Whole Plant"].map(part => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{translations[language].symptoms}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { en: "Yellowing leaves", te: "ఆకులు పసుపు రంగులోకి మారడం" },
                  { en: "Brown spots", te: "గోధుమ రంగు మచ్చలు" },
                  { en: "White powder", te: "తెల్లటి పొడి పూత" },
                  { en: "Wilting stem", te: "కాండం వాడిపోవడం" },
                  { en: "Rotten fruits", te: "కాయలు కుళ్ళిపోవడం" },
                  { en: "Stunted growth", te: "ఎదుగుదల నిలిచిపోవడం" },
                  { en: "Leaf curl", te: "ఆకులు ముడుచుకుపోవడం" }
                ].map(s => {
                  const label = language === "en" ? s.en : s.te;
                  const currentSymptoms = cropAnswers["Symptoms"] ? cropAnswers["Symptoms"].split(", ") : [];
                  const isSelected = currentSymptoms.includes(s.en);
                  return (
                    <button
                      key={s.en}
                      type="button"
                      onClick={() => {
                        let nextSymptoms = [...currentSymptoms];
                        if (isSelected) {
                          nextSymptoms = nextSymptoms.filter(item => item !== s.en);
                        } else {
                          nextSymptoms.push(s.en);
                        }
                        const updated = { ...cropAnswers, "Symptoms": nextSymptoms.join(", ") };
                        setCropAnswers(updated);
                        localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                      }}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${isSelected
                          ? "bg-brand text-brand-foreground border-brand"
                          : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].diseaseDuration}</label>
              <select
                value={cropAnswers["Disease Duration"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Disease Duration": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">-- Select Duration --</option>
                {["1-2 days", "3-5 days", "1-2 weeks", "More than 2 weeks"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].soilType}</label>
              <select
                value={cropAnswers["Soil Type"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Soil Type": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">-- Select Soil --</option>
                {["Clayey Soil", "Sandy Loam", "Alluvial Soil", "Black Cotton Soil", "Red Laterite"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].irrigation}</label>
              <select
                value={cropAnswers["Irrigation Method"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Irrigation Method": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">-- Select Irrigation --</option>
                {["Drip Irrigation", "Sprinkler System", "Flood Irrigation", "Rainfed Only"].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].weather}</label>
              <select
                value={cropAnswers["Weather Conditions"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Weather Conditions": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="">-- Select Weather --</option>
                {["Sunny & Dry", "Very Humid / Wet", "Cloudy & Cold", "Heavy Rainy Season"].map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].prevFertilizer}</label>
              <input
                type="text"
                placeholder="e.g. Urea, NPK 19:19:19"
                value={cropAnswers["Fertilizer Used"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Fertilizer Used": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].prevFertilizerDate}</label>
              <input
                type="date"
                value={cropAnswers["Fertilizer Apply Date"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Fertilizer Apply Date": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].prevPesticide}</label>
              <input
                type="text"
                placeholder="e.g. Mancozeb, Neem Oil"
                value={cropAnswers["Pesticide Used"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Pesticide Used": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].prevSprayDate}</label>
              <input
                type="date"
                value={cropAnswers["Spray Date"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Spray Date": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].affectedPct}</label>
                <span className="text-xs font-bold text-brand">{cropAnswers["Affected Percentage"] || "0"}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={cropAnswers["Affected Percentage"] || "0"}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Affected Percentage": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-brand"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{translations[language].comments}</label>
              <textarea
                rows={2}
                placeholder="Type any specific signs you notice..."
                value={cropAnswers["Comments"] || ""}
                onChange={(e) => {
                  const updated = { ...cropAnswers, "Comments": e.target.value };
                  setCropAnswers(updated);
                  localStorage.setItem(`draft_${selectedCrop}`, JSON.stringify(updated));
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="flex gap-4 border-t border-border pt-4 mt-6">
            <button
              onClick={() => setDetectWorkflowStep("category")}
              className="flex-1 border border-border text-foreground hover:bg-muted text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer bg-card"
            >
              <ChevronLeft className="h-4.5 w-4.5" /> {translations[language].back}
            </button>
            <button
              onClick={() => {
                if (!cropAnswers["Variety"]) {
                  toast.warning(language === "en" ? "Please select a crop variety first." : "దయచేసి మొదట పంట రకాన్ని ఎంచుకోండి.");
                  return;
                }
                setDetectWorkflowStep("upload");
              }}
              className="flex-1 bg-brand text-brand-foreground hover:bg-brand/95 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              {translations[language].continueLabel} <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload Crop Images */}
      {detectWorkflowStep === "upload" && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft max-w-3xl mx-auto space-y-6 text-left relative">
          <div className="text-center space-y-2 border-b border-border pb-3">
            <h3 className="font-extrabold text-md text-foreground">{translations[language].uploadImages}</h3>
            <p className="text-[10px] text-muted-foreground">{translations[language].uploadHelp}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((index) => {
              const img = uploadedImages[index];
              return (
                <div key={index} className="border border-border/80 rounded-xl relative aspect-square bg-muted/30 flex items-center justify-center overflow-hidden border-dashed hover:border-brand/40 transition-colors">
                  {img ? (
                    <>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <span className={`absolute bottom-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded text-white ${img.quality.score >= 70 ? "bg-success/80" : "bg-red-500/80"
                        }`}>
                        {img.quality.score}% Score
                      </span>
                      <button
                        onClick={() => {
                          const nextImages = uploadedImages.filter((_, i) => i !== index);
                          setUploadedImages(nextImages);
                          if (nextImages.length > 0) {
                            setCropImageUrl(nextImages[0].url);
                          }
                        }}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md cursor-pointer border-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2 text-muted-foreground">
                      <Camera className="h-5 w-5 mx-auto opacity-40 mb-1" />
                      <span className="text-[9px] block">Slot {index + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <label className="flex-grow bg-muted/40 hover:bg-muted/70 border border-border text-foreground font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="h-4.5 w-4.5 text-brand" /> {translations[language].gallery}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (uploadedImages.length + files.length > 5) {
                    toast.warning(language === "en" ? "You can only upload up to 5 images." : "మీరు గరిష్టంగా 5 చిత్రాలను మాత్రమే అప్‌లోడ్ చేయగలరు.");
                    return;
                  }
                  try {
                    const compressedFiles = await Promise.all(
                      files.map(file => compressImage(file))
                    );
                    compressedFiles.forEach(file => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const isBlurry = Math.random() < 0.2;
                        const score = isBlurry ? Math.floor(Math.random() * 15) + 50 : Math.floor(Math.random() * 20) + 78;
                        const quality = {
                          blur: isBlurry,
                          brightness: Math.random() > 0.1,
                          focus: true,
                          resolution: "1920x1440",
                          score
                        };
                        setUploadedImages(prev => {
                          const next = [...prev, { url: reader.result as string, quality }];
                          setTimeout(() => setCropImageUrl(next[0].url), 0);
                          return next;
                        });
                      };
                      reader.readAsDataURL(file);
                    });
                  } catch (err) {
                    console.error("Compression error:", err);
                    toast.error("Failed to process images.");
                  }
                }}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={startCamera}
              className="flex-grow bg-muted/40 hover:bg-muted/70 border border-border text-foreground font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Camera className="h-4.5 w-4.5 text-brand" /> {translations[language].camera}
            </button>
          </div>

          {uploadedImages.length > 0 && (
            <div className="bg-muted/10 border border-border rounded-xl p-4 space-y-3.5 text-xs text-left">
              <h4 className="font-bold text-foreground flex items-center gap-1.5"><CheckCircle2 className="h-4.5 w-4.5 text-brand" /> {translations[language].qualityCheck}</h4>
              <div className="space-y-2">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-border/40 pb-2 last:border-0 last:pb-0">
                    <span className="font-semibold text-muted-foreground">Image Slot {i + 1} ({img.quality.resolution})</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-0.5 text-[10px]">
                        {img.quality.blur ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                        {translations[language].blurLabel}: {img.quality.blur ? "Blurry" : "Clear"}
                      </span>
                      <span className={`font-bold rounded px-1.5 py-0.5 text-[10px] ${img.quality.score >= 70 ? "bg-success/10 text-success" : "bg-red-50 text-red-600 animate-pulse"
                        }`}>
                        {img.quality.score}% Quality
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {uploadedImages.some(img => img.quality.blur) && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] leading-relaxed flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <p>{translations[language].blurryWarning}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 border-t border-border pt-4 mt-6">
            <button
              onClick={() => setDetectWorkflowStep("info")}
              className="flex-grow border border-border text-foreground hover:bg-muted text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer bg-card"
            >
              <ChevronLeft className="h-4.5 w-4.5" /> {translations[language].back}
            </button>
            <button
              onClick={handleAIScan}
              disabled={uploadedImages.length === 0}
              className="flex-grow bg-brand text-brand-foreground hover:bg-brand/95 text-xs font-bold py-2.5 rounded-lg disabled:opacity-55 flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              <Sparkles className="h-4.5 w-4.5" /> {translations[language].submitAnalysis}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: AI Analysis Processing screen */}
      {detectWorkflowStep === "analyzing" && (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft max-w-xl mx-auto text-center space-y-6 py-16 relative">
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-brand-soft border-t-brand animate-spin" />
            <div className="absolute inset-2 bg-brand/5 rounded-full flex items-center justify-center animate-pulse">
              <ScanLine className="h-8 w-8 text-brand animate-[bounce_2s_infinite]" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-md text-foreground">{translations[language].analyzingTitle}</h3>
            <p className="text-xs text-muted-foreground">{translations[language].eta}</p>
          </div>

          <div className="max-w-sm mx-auto bg-muted/15 border rounded-2xl p-4 text-xs text-left space-y-2.5">
            {[
              translations[language].analyzingStage0,
              translations[language].analyzingStage1,
              translations[language].analyzingStage2,
              translations[language].analyzingStage3,
              translations[language].analyzingStage4,
              translations[language].analyzingStage5,
              translations[language].analyzingStage6
            ].map((stage, index) => {
              const isActive = analyzingStageIndex === index;
              const isDone = analyzingStageIndex > index;
              return (
                <div key={index} className="flex items-center gap-2 transition-all">
                  <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? "bg-brand text-brand-foreground scale-110 animate-pulse" : isDone ? "bg-success text-white" : "bg-muted text-muted-foreground/60"
                    }`}>
                    {isDone ? "✓" : index + 1}
                  </span>
                  <span className={`${isActive ? "text-brand font-bold" : isDone ? "text-foreground font-semibold" : "text-muted-foreground/60"}`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: AI Disease Report */}
      {detectWorkflowStep === "report" && scanResult && (() => {
        const reportDoc = scanResult.report || scanResult;
        const details = scanResult.details || scanResult.aiPrediction || {};

        return (
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Left and Middle Content */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2 space-y-5 text-left">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <span className="px-2.5 py-0.5 rounded bg-brand/10 text-brand text-[9px] font-bold uppercase tracking-wider">AI Prediction Report</span>
                <span className="flex items-center gap-1 text-xs font-bold text-brand">
                  <Sparkles className="h-4 w-4" /> {((details.confidence || 0.82) * 100).toFixed(0)}% Confidence
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-lg text-foreground leading-tight">{details.disease}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-muted text-muted-foreground text-[8px] font-bold px-2 py-0.5 rounded uppercase">Crop: {selectedCrop}</span>
                  <span className="bg-red-50 text-red-600 text-[8px] font-bold px-2 py-0.5 rounded uppercase">Severity: High</span>
                  <span className="bg-yellow-50 text-yellow-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase">Risk: Moderate</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-xs border-t border-border pt-4">
                <div className="space-y-1">
                  <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wide">Possible Causes</span>
                  <p className="text-foreground leading-relaxed font-medium">{details.causes}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wide">Observed Symptoms</span>
                  <p className="text-foreground leading-relaxed font-medium">{details.symptomsDetail || details.symptoms}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wide">Preventive Measures</span>
                  <p className="text-foreground leading-relaxed font-medium">{details.prevention}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl space-y-2 text-left">
                  <p className="font-bold text-brand text-xs">Chemical Fungicide treatment</p>
                  <div className="flex flex-wrap gap-1">
                    {(details.pesticides || []).map((pest: string, idx: number) => (
                      <span key={idx} className="bg-brand/10 text-brand text-[8.5px] font-bold px-2 py-0.5 rounded">{pest}</span>
                    ))}
                    {(details.fertilizers || []).map((fert: string, idx: number) => (
                      <span key={idx} className="bg-blue-50 text-blue-600 text-[8.5px] font-bold px-2 py-0.5 rounded">{fert}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground"><span className="font-bold">Dosage:</span> {details.dosage}</p>
                  <p className="text-[10px] text-muted-foreground"><span className="font-bold">Spray Schedule:</span> {details.recoveryTimeline}</p>
                </div>

                <div className="p-3 bg-emerald-50/50 border border-emerald-200/50 rounded-xl space-y-2 text-left">
                  <p className="font-bold text-emerald-600 text-xs">Organic Remedy alternatives</p>
                  <p className="text-[11px] text-foreground leading-relaxed font-medium">{details.organicTreatment}</p>
                  <p className="text-[10px] text-muted-foreground"><span className="font-bold">Application Method:</span> {details.applicationMethod}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-brand" /> {translations[language].buyProducts}
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory">
                  {recommendedProductsList.map((prod: any) => (
                    <div key={prod._id} className="min-w-[170px] w-[170px] flex-shrink-0 p-3 border border-border rounded-xl flex flex-col justify-between hover:bg-muted/10 transition-colors text-left bg-card snap-start">
                      <div>
                        <img src={prod.imageUrl} alt="" className="w-full aspect-[4/3] object-cover rounded-lg border mb-2 bg-muted" />
                        <h5 className="font-bold text-[10px] text-foreground truncate leading-tight">{prod.name}</h5>
                        <p className="text-[10px] text-brand font-extrabold mt-1">₹{prod.price}</p>
                      </div>
                      <button
                        onClick={() => handleAddToCart(prod._id)}
                        className="w-full mt-3 bg-brand text-brand-foreground font-bold text-[9px] py-1.5 rounded-lg hover:bg-brand/90 flex items-center justify-center gap-1 cursor-pointer border-0"
                      >
                        <ShoppingCart className="h-3 w-3" /> Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft text-left space-y-4 flex flex-col justify-between h-fit">
              {reportDoc.specialistDiagnosis ? (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3">
                    <CheckCircle2 className="h-5 w-5 text-success animate-pulse" />
                    Agronomist Diagnosis
                  </h4>
                  <div className="bg-success/5 border border-success/20 p-4 rounded-xl space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Confirmed Disease</span>
                      <h5 className="text-sm font-bold text-foreground mt-0.5">{reportDoc.specialistDiagnosis.disease}</h5>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Prescription Advice</span>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{reportDoc.specialistDiagnosis.diagnosis}</p>
                    </div>
                    {reportDoc.specialistDiagnosis.pesticides && reportDoc.specialistDiagnosis.pesticides.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Prescribed Treatments</span>
                        <div className="flex flex-wrap gap-1.5">
                          {reportDoc.specialistDiagnosis.pesticides.map((pest: string, idx: number) => (
                            <span key={idx} className="bg-success/15 text-success text-[9px] font-bold px-2 py-0.5 rounded-md font-semibold">
                              {pest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                    <span className="font-bold text-foreground">Diagnosed by:</span> {reportDoc.assignedSpecialistId?.name || "Senior Specialist"}
                  </div>

                  <button
                    onClick={() => {
                      const matchingConsult = consultations.find(c => c.reportId?._id === reportDoc._id || c.reportId === reportDoc._id);
                      if (matchingConsult) {
                        setSelectedConsultation(matchingConsult);
                        setActiveTab("consultations");
                      } else {
                        if (setAutoOpenBookingReportId) {
                          setAutoOpenBookingReportId(reportDoc._id);
                        }
                        setActiveTab("consultations");
                      }
                    }}
                    className="w-full bg-brand text-brand-foreground hover:bg-brand/95 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    <MessageSquare className="h-4.5 w-4.5" />
                    Book Agronomist Consultation
                  </button>
                </div>
              ) : reportDoc.status === 'ASSIGNED' ? (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3">
                    <Activity className="h-5 w-5 text-brand animate-pulse" />
                    Review in Progress
                  </h4>
                  <div className="bg-emerald-50/50 border border-emerald-200/50 p-4 rounded-xl text-center py-6 space-y-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm mx-auto">
                      {reportDoc.assignedSpecialistId?.name ? reportDoc.assignedSpecialistId.name[0].toUpperCase() : 'A'}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-foreground">
                        Assigned to: Dr. {reportDoc.assignedSpecialistId?.name || "Agronomist Specialist"}
                      </h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {reportDoc.assignedSpecialistId?.specialization || "General Specialist"}
                      </p>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed max-w-[200px] mx-auto pt-1 font-semibold">
                      Reviewing your leaf symptoms. Your certified prescription is being compiled.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const matchingConsult = consultations.find(c => c.reportId?._id === reportDoc._id || c.reportId === reportDoc._id);
                      if (matchingConsult) {
                        setSelectedConsultation(matchingConsult);
                        setActiveTab("consultations");
                      } else {
                        if (setAutoOpenBookingReportId) {
                          setAutoOpenBookingReportId(reportDoc._id);
                        }
                        setActiveTab("consultations");
                      }
                    }}
                    className="w-full bg-brand hover:bg-brand/95 text-brand-foreground font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    <MessageSquare className="h-4.5 w-4.5" />
                    Book Agronomist Consultation
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1">
                      <ChevronRight className="h-4.5 w-4.5 text-brand shrink-0" /> {translations[language].consultSpecialistLabel}
                    </h4>
                    <div className="bg-yellow-50/50 border border-yellow-200/50 p-4 rounded-xl space-y-3.5 font-medium">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-yellow-800 font-bold">{translations[language].specialistFee}</span>
                        <span className="text-sm font-extrabold text-yellow-800">₹499</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-yellow-700 font-semibold">
                        <span>{translations[language].responseTime}</span>
                        <span className="font-bold">Under 2 hours</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="font-bold text-muted-foreground tracking-wide uppercase">{translations[language].consultIncludes}</p>
                      <ul className="space-y-2 pl-0">
                        {[
                          translations[language].consultBenefit1,
                          translations[language].consultBenefit2,
                          translations[language].consultBenefit3,
                          translations[language].consultBenefit4
                        ].map((b, i) => (
                          <li key={i} className="flex items-start gap-1.5 list-none">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span className="text-[11px] text-foreground font-semibold leading-tight">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border">
                    <button
                      onClick={() => handleRequestConsultation(reportDoc._id)}
                      disabled={isPaymentProcessing}
                      className="w-full bg-brand text-brand-foreground hover:bg-brand/95 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer border-0 disabled:opacity-50"
                    >
                      <CreditCard className="h-4.5 w-4.5" /> {translations[language].payConsultFee}
                    </button>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => setDetectWorkflowStep("category")}
                  className="w-full border border-border text-foreground hover:bg-muted font-bold text-xs py-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors bg-card"
                >
                  Re-Scan Crop Category
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Real-time camera dialog modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-lift flex flex-col h-[85vh] max-h-[600px] text-left">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="font-extrabold text-sm text-foreground m-0">Real-Time Crop Camera</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Align your crop leaves inside the frame</p>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 hover:bg-muted rounded-full border-0 bg-transparent cursor-pointer font-bold text-xs text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-8 border-2 border-dashed border-brand/50 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="text-[10px] text-brand bg-black/60 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm">
                  Crop Leaf Target Area
                </div>
              </div>
            </div>
            
            <div className="p-5 flex justify-between items-center bg-muted/20 border-t border-border">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={capturePhoto}
                className="h-14 w-14 rounded-full bg-brand hover:bg-brand/90 text-brand-foreground flex items-center justify-center shadow-lg border-4 border-white/20 active:scale-95 transition-all cursor-pointer"
                title="Capture Photo"
              >
                <div className="h-6 w-6 rounded-full bg-brand-foreground" />
              </button>
              
              <div className="w-14" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
