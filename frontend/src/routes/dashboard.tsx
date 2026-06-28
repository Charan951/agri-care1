import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard, User as UserIcon, ScanLine, MessageSquare, Ticket as TicketIcon,
  Store, ShoppingCart, Package, CreditCard, History, CloudSun, Heart,
  HelpCircle, LogOut, ChevronRight, ChevronLeft, Menu, X,
  Plus, Trash2, Camera, Upload, Send, Star, AlertTriangle, CheckCircle2,
  FileText, ArrowRight, ShieldAlert, Sparkles, Volume2, Mic, Play, RefreshCw, Printer,
  Activity
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

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

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Farmer Dashboard — AgriCare" }
    ],
  }),
  component: CustomerDashboard,
});

type TabType =
  | "overview"
  | "profile"
  | "detect"
  | "consultations"
  | "tickets"
  | "marketplace"
  | "cart"
  | "orders"
  | "payments"
  | "crop-history"
  | "weather"
  | "wishlist"
  | "help-support";

const translations: Record<string, Record<string, string>> = {
  en: {
    languageName: "English",
    toggleLanguage: "తెలుగు",
    title: "Select Crop Category",
    subtitle: "Choose the crop you want to diagnose",
    progressCrop: "Crop",
    progressInfo: "Information",
    progressImages: "Images",
    progressAnalysis: "AI Analysis",
    progressRec: "Recommendation",
    variety: "Crop Variety",
    cropAge: "Crop Age",
    days: "Days",
    growthStage: "Growth Stage",
    affectedPart: "Affected Plant Part",
    symptoms: "Observed Symptoms",
    diseaseDuration: "Disease Duration",
    prevFertilizer: "Previous Fertilizer Used",
    prevFertilizerDate: "Fertilizer Application Date",
    prevPesticide: "Pesticide/Fungicide Used",
    prevSprayDate: "Previous Spray Date",
    soilType: "Soil Type",
    irrigation: "Irrigation Method",
    weather: "Weather Conditions",
    affectedPct: "Percentage of Crop Affected",
    comments: "Additional Comments / Observations",
    back: "Back",
    continueLabel: "Continue",
    submitAnalysis: "Submit for AI Analysis",
    uploadImages: "Upload Crop Images",
    uploadHelp: "Upload up to 5 clear images of the affected crop plant",
    camera: "Take Photo (Camera)",
    gallery: "Upload from Gallery",
    qualityCheck: "AI Image Quality Check",
    qualityScore: "Image Quality Score",
    blurLabel: "Blur Detection",
    brightnessLabel: "Brightness Check",
    focusLabel: "Crop Focus Detection",
    resolutionLabel: "Resolution Check",
    blurryWarning: "Warning: Image appears blurry or dark. For best AI detection results, please upload a clearer, well-lit image.",
    replace: "Replace",
    delete: "Delete",
    analyzingTitle: "Analyzing Crop Leaf Health...",
    analyzingStage0: "Uploading Leaf Images...",
    analyzingStage1: "Enhancing Image Contrast & Clarity...",
    analyzingStage2: "Detecting Leaf Anomalies & Lesions...",
    analyzingStage3: "Matching with Global Plant Pathology Database...",
    analyzingStage4: "Searching Similar Cases in AI Library...",
    analyzingStage5: "Generating Treatment and Cure Plan...",
    analyzingStage6: "Preparing Organic and Chemical Recommendations...",
    eta: "Estimated time: 10-20 seconds",
    buyProducts: "Buy Recommended Products",
    consultSpecialistLabel: "Consult Specialist",
    specialistFee: "Consultation Fee",
    responseTime: "Response Time",
    consultIncludes: "Consultation Includes",
    consultBenefit1: "Expert Agronomist review of crop image files",
    consultBenefit2: "In-app live text & voice note support",
    consultBenefit3: "Personalized chemical & organic spray schedule",
    consultBenefit4: "Downloadable PDF Treatment Report",
    payConsultFee: "Pay Consultation Fee & Connect",
    timelinePayment: "Payment Completed",
    timelineTicket: "Ticket Created",
    timelineAdmin: "Admin Review & Specialist Selection",
    timelineAssigned: "Agronomist Specialist Assigned",
    timelineReviewing: "Specialist Reviewing Case Files",
    timelineChat: "Chat Conversation Started",
    timelineReport: "Treatment Report Generated",
    timelineCompleted: "Consultation Completed Successfully",
    ratingTitle: "Rate Specialist & Experience",
    rateSpecialist: "Rate Specialist",
    rateTreatment: "Rate Treatment Quality",
    rateExperience: "Overall Experience Rating",
    writtenReview: "Tell us about your experience...",
    submitFeedback: "Submit Feedback & Close Ticket",
    historyTitle: "Farmer Activity & Logs History",
    historySearchPlaceholder: "Search reports, orders, tickets...",
    all: "All Logs",
    reports: "AI Reports",
    consults: "Consultations",
    orders: "Marketplace Orders",
    payments: "Payment Logs",
    downloadPDF: "Download Treatment PDF",
    followUp: "Next Follow-up",
    dosage: "Dosage",
    method: "Application Method",
    spraySchedule: "Spray Timeline Schedule",
    safetyLabel: "Safety Precautions",
    timelineHeader: "Consultation Progress Status",
    chatOnline: "Online",
    chatPlaceholder: "Type message to agronomist...",
    quickReply1: "Is this disease contagious to other plants?",
    quickReply2: "Can I spray this when it is raining?",
    quickReply3: "Are there any organic options instead?",
    quickReply4: "How long before I see improvement?",
    welcomeTitle: "Namaskar, {name}!",
    welcomeSubtitle: "Welcome to your farm advisor platform. You currently have {count} registered fields. Check crop safety recommendations below.",
    harvestAdvisory: "Harvest Advisory",
    scanLeaves: "Scan Affected Leaves",
    visitStore: "Visit Store",
    quickActions: "Quick Farmer Actions",
    actionScan: "Scan Crop",
    actionTicket: "Raise Ticket",
    actionChat: "Chat Specialist",
    actionBuy: "Buy Products",
    exitPortal: "Exit Portal",
    overview_menu: "Dashboard Overview",
    profile_menu: "Farms & Profile",
    detect_menu: "AI Disease Detection",
    consultations_menu: "Agronomist Consultations",
    tickets_menu: "Support Tickets",
    marketplace_menu: "Marketplace Shop",
    cart_menu: "Shopping Cart",
    orders_menu: "My Orders",
    payments_menu: "Payments Logs",
    "crop-history_menu": "Crop Care History",
    weather_menu: "Weather Forecast",
    wishlist_menu: "My Wishlist",
    "help-support_menu": "Help & Live Support",
    overview_bottom: "Home",
    detect_bottom: "Detect",
    marketplace_bottom: "Shop",
    orders_bottom: "Orders",
    profile_bottom: "Profile"
  },
  te: {
    languageName: "తెలుగు",
    toggleLanguage: "English",
    title: "పంట వర్గాన్ని ఎంచుకోండి",
    subtitle: "మీరు నిర్ధారించాలనుకుంటున్న పంటను ఎంచుకోండి",
    progressCrop: "పంట",
    progressInfo: "సమాచారం",
    progressImages: "చిత్రాలు",
    progressAnalysis: "AI విశ్లేషణ",
    progressRec: "సిఫార్సు",
    variety: "పంట రకం",
    cropAge: "పంట వయస్సు",
    days: "రోజులు",
    growthStage: "ఎదుగుదల దశ",
    affectedPart: "ప్రభావితమైన పంట భాగం",
    symptoms: "గమనించిన లక్షణాలు",
    diseaseDuration: "వ్యాధి వ్యవధి",
    prevFertilizer: "గతంలో వాడిన ఎరువులు",
    prevFertilizerDate: "ఎరువులు వేసిన తేదీ",
    prevPesticide: "వాడిన పురుగుమందు/శిలీంధ్రనాశని",
    prevSprayDate: "గతంలో పిచికారీ చేసిన తేదీ",
    soilType: "నేల రకం",
    irrigation: "నీటి పారుదల విధానం",
    weather: "వాతావరణ परिस्थितियों",
    affectedPct: "ప్రభావితమైన పంట శాతం",
    comments: "అదనపు వ్యాఖ్యలు / పరిశీలనలు",
    back: "వెనుకకు",
    continueLabel: "కొనసాగించు",
    submitAnalysis: "AI విశ్లేషణకు పంపండి",
    uploadImages: "పంట చిత్రాలను అప్‌లోడ్ చేయండి",
    uploadHelp: "ప్రభావితమైన పంట మొక్క యొక్క 5 స్పష్టమైన చిత్రాలను అప్‌లోడ్ చేయండి",
    camera: "ఫోటో తీయండి (కెమెరా)",
    gallery: "గ్యాలరీ నుండి అప్‌లోడ్ చేయండి",
    qualityCheck: "AI చిత్ర నాణ్యత తనిఖీ",
    qualityScore: "చిత్ర నాణ్యత స్కోర్",
    blurLabel: "మసకబారిన గుర్తింపు",
    brightnessLabel: "వెలుతురు తనిఖీ",
    focusLabel: "పంటపై దృష్టి గుర్తింపు",
    resolutionLabel: "రిజల్యూషన్ తనిఖీ",
    blurryWarning: "హెచ్చరిక: చిత్రం మసకగా లేదా చీకటిగా ఉంది. మంచి ఫలితాల కోసం, దయచేసి స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి.",
    replace: "మార్చండి",
    delete: "తొలగించండి",
    analyzingTitle: "పంట ఆకు ఆరోగ్యాన్ని విశ్లేషిస్తోంది...",
    analyzingStage0: "ఆకు చిత్రాలను అప్‌లోడ్ చేస్తోంది...",
    analyzingStage1: "చిత్రం యొక్క కాంట్రాస్ట్ & స్పష్టతను మెరుగుపరుస్తోంది...",
    analyzingStage2: "ఆకులోని అసాధారణతలు & మచ్చలను గుర్తిస్తోంది...",
    analyzingStage3: "ప్రపంచ పంట వ్యాధుల డేటాబేస్ తో సరిపోలుస్తోంది...",
    analyzingStage4: "AI లైబ్రరీలో ఇటువంటి కేసుల కోసం శోధిస్తోంది...",
    analyzingStage5: "చికిత్స మరియు నివారణ ప్రణాళికను సిద్ధం చేస్తోంది...",
    analyzingStage6: "సేంద్రీయ మరియు రసాయన సిఫార్సులను సిద్ధం చేస్తోంది...",
    eta: "అంచనా సమయం: 10-20 సెకన్లు",
    buyProducts: "సిఫార్సు చేసిన ఉత్పత్తులను కొనండి",
    consultSpecialistLabel: "నిపుణుడిని సంప్రదించండి",
    specialistFee: "సంప్రదింపు రుసుము",
    responseTime: "ప్రతిస్పందన సమయం",
    consultIncludes: "సంప్రదింపులో ఇవి ఉంటాయి",
    consultBenefit1: "పంట చిత్రాల నిపుణుల పరిశీలన",
    consultBenefit2: "లైవ్ టెక్స్ట్ & వాయిస్ నోట్ చాట్ సపోర్ట్",
    consultBenefit3: "వ్యక్తిగతీకరించిన రసాయన & సేంద్రీయ పిచికారీ ప్రణాళిక",
    consultBenefit4: "డౌన్‌లోడ్ చేసుకోదగిన PDF చికిత్స నివేదిక",
    payConsultFee: "సంప్రదింపు రుసుము చెల్లించి కనెక్ట్ అవ్వండి",
    timelinePayment: "చెల్లింపు పూర్తయింది",
    timelineTicket: "టికెట్ సృష్టించబడింది",
    timelineAdmin: "అడ్మిన్ పరిశీలన & నిపుణుల ఎంపిక",
    timelineAssigned: "పంట నిపుణుడు కేటాయించబడ్డారు",
    timelineReviewing: "నిపుణులు కేసును పరిశీలిస్తున్నారు",
    timelineChat: "చాట్ సంభాషణ ప్రారంభమైంది",
    timelineReport: "చికిత్స నివేదిక సృష్టించబడింది",
    timelineCompleted: "సంప్రదింపు విజయవంతంగా పూర్తయింది",
    ratingTitle: "నిపుణులు & అనుభవం రేటింగ్",
    rateSpecialist: "నిపుణుల రేటింగ్",
    rateTreatment: "చికిత్స నాణ్యత రేటింగ్",
    rateExperience: "మొత్తం అనుభవం రేటింగ్",
    writtenReview: "మీ అభిప్రాయాన్ని రాయండి...",
    submitFeedback: "అభిప్రాయాన్ని సమర్పించి టికెట్ మూసివేయండి",
    historyTitle: "రైతు కార్యాచరణ & చరిత్ర లాగ్‌లు",
    historySearchPlaceholder: "రిపోర్టులు, ఆర్డర్లు, టికెట్లు శోధించండి...",
    all: "అన్ని లాగ్‌లు",
    reports: "AI రిపోర్టులు",
    consults: "సంప్రదింపులు",
    orders: "ఆర్డర్లు",
    payments: "చెల్లింపు లాగ్‌లు",
    downloadPDF: "చికిత్స PDF డౌన్‌లోడ్ చేసుకోండి",
    followUp: "తదుపరి సంప్రదింపు",
    dosage: "మోతాదు",
    method: "పిచికారీ పద్ధతి",
    spraySchedule: "పిచికారీ కాలపట్టిక",
    safetyLabel: "భద్రతా జాగ్రత్తలు",
    timelineHeader: "సంప్రదింపు పురోగతి స్థితి",
    chatOnline: "ఆన్‌లైన్",
    chatPlaceholder: "నిపుణుడికి సందేశం రాయండి...",
    quickReply1: "ఈ వ్యాధి ఇతర మొక్కలకు వ్యాపిస్తుందా?",
    quickReply2: "వర్షం పడుతున్నప్పుడు నేను దీనిని పిచికారీ చేయవచ్చా?",
    quickReply3: "ప్రత్యామ్నాయంగా ఏవైనా సేంద్రీయ ఎంపికలు ఉన్నాయా?",
    quickReply4: "కోలుకోవడానికి ఎంత సమయం పడుతుంది?",
    welcomeTitle: "నమస్కారం, {name}!",
    welcomeSubtitle: "మీ పంట సలహా వేదికకు స్వాగతం. ప్రస్తుతం మీకు {count} రిజిస్టర్డ్ పొలాలు ఉన్నాయి. పంట రక్షణ సిఫార్సులను క్రింద చూడండి.",
    harvestAdvisory: "పంట సలహా",
    scanLeaves: "ప్రభావిత ఆకులను స్కాన్ చేయండి",
    visitStore: "దుకాణాన్ని సందర్శించండి",
    quickActions: "త్వరిత రైతు చర్యలు",
    actionScan: "పంటను స్కాన్ చేయండి",
    actionTicket: "టికెట్ సమర్పించండి",
    actionChat: "నిపుణుడితో చాట్",
    actionBuy: "ఉత్పత్తుల కొనుగోలు",
    exitPortal: "పోర్టల్ నుండి నిష్క్రమించు",
    overview_menu: "డాష్‌బోర్డ్ అవలోకనం",
    profile_menu: "పొలాలు & ప్రొఫైల్",
    detect_menu: "AI తెగుళ్ల గుర్తింపు",
    consultations_menu: "నిపుణుల సంప్రదింపులు",
    tickets_menu: "సహాయక టిక్కెట్లు",
    marketplace_menu: "మార్కెట్ ప్లేస్ షాప్",
    cart_menu: "షాపింగ్ కార్ట్",
    orders_menu: "నా ఆర్డర్లు",
    payments_menu: "చెల్లింపుల చరిత్ర",
    "crop-history_menu": "పంట సంరక్షణ చరిత్ర",
    weather_menu: "వాతావరణ సూచన",
    wishlist_menu: "నా కోరికల జాబితా",
    "help-support_menu": "సహాయం & మద్దతు",
    overview_bottom: "హోమ్",
    detect_bottom: "గుర్తించండి",
    marketplace_bottom: "షాప్",
    orders_bottom: "ఆర్డర్లు",
    profile_bottom: "ప్రొఫైల్"
  }
};

function CustomerDashboard() {
  const { user, loading, isAuthenticated, logout, refreshProfile } = useAuth();
  
  // Translation & Workflow States
  const [language, setLanguage] = useState<"en" | "te">("en");
  const [detectWorkflowStep, setDetectWorkflowStep] = useState<"category" | "info" | "upload" | "analyzing" | "report">("category");
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string, quality: { blur: boolean, brightness: boolean, focus: boolean, resolution: string, score: number } }>>([]);
  const [analyzingStageIndex, setAnalyzingStageIndex] = useState(0);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "reports" | "consults" | "orders" | "payments">("all");
  
  // Rating States
  const [specialistRating, setSpecialistRating] = useState(5);
  const [treatmentRating, setTreatmentRating] = useState(5);
  const [experienceRating, setExperienceRating] = useState(5);
  const [writtenReview, setWrittenReview] = useState("");
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingTargetConsultation, setRatingTargetConsultation] = useState<any>(null);
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // Sidebar / Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [scansHistory, setScansHistory] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingSection, setLoadingSection] = useState(false);

  // Detailed Modal/Chat States
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);

  // Input States
  const [ticketMessage, setTicketMessage] = useState("");
  const [consultMessage, setConsultMessage] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketImage, setNewTicketImage] = useState("");
  
  // Crop config
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

  // AI Scan Inputs
  const [selectedCrop, setSelectedCrop] = useState("Paddy (Rice)");
  const [cropImageUrl, setCropImageUrl] = useState("https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=600&auto=format&fit=crop");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [detectStep, setDetectStep] = useState<"category" | "upload_scan">("category");
  const [cropAnswers, setCropAnswers] = useState<Record<string, string>>({});

  // Profile Edit Inputs
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmSize, setNewFarmSize] = useState("");
  const [newFarmSoil, setNewFarmSoil] = useState("Black Clay");
  const [newFarmCrop, setNewFarmCrop] = useState("Cotton");
  const [newFarmLoc, setNewFarmLoc] = useState("");

  const [newAddressLabel, setNewAddressLabel] = useState("Home");
  const [newAddressStreet, setNewAddressStreet] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");
  const [newAddressState, setNewAddressState] = useState("");
  const [newAddressPincode, setNewAddressPincode] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Checkout States
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "payment" | "success">("cart");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "COD">("UPI");
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [checkoutReceipt, setCheckoutReceipt] = useState<any>(null);

  // Floating Support Chat State
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportChatLog, setSupportChatLog] = useState<Array<{ sender: 'farmer' | 'support', text: string }>>([
    { sender: 'support', text: 'Hello! Welcome to AgriCare Live Support. How can we help you today?' }
  ]);

  // Marketplace Filters
  const [marketSearch, setMarketSearch] = useState("");
  const [marketCategory, setMarketCategory] = useState("");

  // Refs for auto-scroll in chats
  const ticketChatEndRef = useRef<HTMLDivElement>(null);
  const consultChatEndRef = useRef<HTMLDivElement>(null);

  // Security Check Redirects
  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "FARMER")) {
      toast.error("Unauthorized. Farmers portal only.");
      navigate({ to: "/login" });
    }
  }, [loading, isAuthenticated, user, navigate]);

  // Fetch Core Dashboard Summary
  const fetchDashboardSummary = async () => {
    try {
      const response = await apiFetch("/api/customer/dashboard-summary");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Error loading dashboard details", err);
    }
  };

  // Fetch Section Data based on Active Tab
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "FARMER") return;

    fetchDashboardSummary();

    const loadData = async () => {
      setLoadingSection(true);
      try {
        if (activeTab === "profile") {
          const res = await apiFetch("/api/customer/profile");
          if (res.ok) {
            const data = await res.json();
            setProfileData(data.user);
            setFarms(data.user.farms || []);
            setEditName(data.user.name || "");
            setEditMobile(data.user.mobile || "");
            setEditRegion(data.user.workingRegion || "");
            setEditLanguage(data.user.preferredLanguage || "English");
            setEditAvatar(data.user.avatarUrl || "");
          }
        } else if (activeTab === "detect" || activeTab === "crop-history") {
          const res = await apiFetch("/api/customer/disease-detection/history");
          if (res.ok) {
            const data = await res.json();
            setScansHistory(data.reports);
          }
        } else if (activeTab === "consultations") {
          const res = await apiFetch("/api/customer/consultations");
          if (res.ok) {
            const data = await res.json();
            setConsultations(data.consultations);
          }
        } else if (activeTab === "tickets") {
          const res = await apiFetch("/api/customer/tickets");
          if (res.ok) {
            const data = await res.json();
            setTickets(data.tickets);
          }
        } else if (activeTab === "marketplace") {
          const catQuery = marketCategory ? `&category=${marketCategory}` : "";
          const searchQuery = marketSearch ? `&search=${marketSearch}` : "";
          const res = await apiFetch(`/api/customer/products?${catQuery}${searchQuery}`);
          if (res.ok) {
            const data = await res.json();
            setProducts(data.products);
          }
        } else if (activeTab === "cart") {
          const res = await apiFetch("/api/customer/cart");
          if (res.ok) {
            const data = await res.json();
            setCart(data.cart || []);
          }
        } else if (activeTab === "wishlist") {
          const res = await apiFetch("/api/customer/wishlist");
          if (res.ok) {
            const data = await res.json();
            setWishlist(data.wishlist || []);
          }
        } else if (activeTab === "orders") {
          const res = await apiFetch("/api/customer/orders");
          if (res.ok) {
            const data = await res.json();
            setOrders(data.orders || []);
          }
        } else if (activeTab === "payments") {
          const res = await apiFetch("/api/customer/payments");
          if (res.ok) {
            const data = await res.json();
            setPayments(data.payments || []);
          }
        } else if (activeTab === "weather") {
          const res = await apiFetch("/api/customer/weather");
          if (res.ok) {
            const data = await res.json();
            setWeather(data.weatherData);
          }
        }
      } catch (err) {
        console.error("Error loading tab data", err);
      } finally {
        setLoadingSection(false);
      }
    };

    loadData();
  }, [activeTab, isAuthenticated, user, marketCategory, marketSearch]);

  // Socket IO updates
  useEffect(() => {
    if (!socket) return;

    socket.on("ticket_chat_updated", (data: any) => {
      if (selectedTicket && selectedTicket._id === data.ticketId) {
        setSelectedTicket((prev: any) => ({ ...prev, chatHistory: data.chatHistory }));
        setTimeout(() => ticketChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
      // Reload tickets list
      apiFetch("/api/customer/tickets")
        .then(res => res.json())
        .then(resData => setTickets(resData.tickets));
    });

    socket.on("consultation_chat_updated", (data: any) => {
      if (selectedConsultation && selectedConsultation._id === data.consultationId) {
        setSelectedConsultation((prev: any) => ({ ...prev, chatHistory: data.chatHistory }));
        setTimeout(() => consultChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
      // Reload list
      apiFetch("/api/customer/consultations")
        .then(res => res.json())
        .then(resData => setConsultations(resData.consultations));
    });

    socket.on("order_updated", () => {
      apiFetch("/api/customer/orders")
        .then(res => res.json())
        .then(resData => setOrders(resData.orders));
      fetchDashboardSummary();
    });

    return () => {
      socket.off("ticket_chat_updated");
      socket.off("consultation_chat_updated");
      socket.off("order_updated");
    };
  }, [socket, selectedTicket, selectedConsultation]);

  // Auto-scroll chats
  useEffect(() => {
    ticketChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.chatHistory]);

  useEffect(() => {
    consultChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConsultation?.chatHistory]);

  // Profile functions
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          mobile: editMobile,
          workingRegion: editRegion,
          preferredLanguage: editLanguage,
          avatarUrl: editAvatar,
          savedAddresses: profileData?.savedAddresses
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        toast.success("Profile details updated successfully!");
        refreshProfile();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Profile update error.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/customer/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (res.ok) {
        toast.success("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
      } else {
        const err = await res.json();
        toast.error(err.message || "Invalid password update credentials");
      }
    } catch (err) {
      toast.error("Network error updating password");
    }
  };

  // Farm functions
  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/customer/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFarmName,
          size: Number(newFarmSize),
          soilType: newFarmSoil,
          cropType: newFarmCrop,
          location: newFarmLoc
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFarms(data.farms);
        toast.success("New farm added successfully!");
        setNewFarmName("");
        setNewFarmSize("");
        setNewFarmLoc("");
      }
    } catch (err) {
      toast.error("Error adding farm");
    }
  };

  const handleDeleteFarm = async (farmId: string) => {
    try {
      const res = await apiFetch(`/api/customer/farms/${farmId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setFarms(data.farms);
        toast.success("Farm deleted successfully!");
      }
    } catch (err) {
      toast.error("Error deleting farm");
    }
  };

  // Address helper
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentAddresses = profileData?.savedAddresses || [];
      const updatedAddresses = [
        ...currentAddresses,
        { label: newAddressLabel, street: newAddressStreet, city: newAddressCity, state: newAddressState, pincode: newAddressPincode }
      ];

      const res = await apiFetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          mobile: editMobile,
          workingRegion: editRegion,
          preferredLanguage: editLanguage,
          avatarUrl: editAvatar,
          savedAddresses: updatedAddresses
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        toast.success("New address added successfully!");
        setNewAddressStreet("");
        setNewAddressCity("");
        setNewAddressState("");
        setNewAddressPincode("");
      }
    } catch (err) {
      toast.error("Error saving address");
    }
  };

  const handleDeleteAddress = async (addressIndex: number) => {
    try {
      const currentAddresses = profileData?.savedAddresses || [];
      const updatedAddresses = currentAddresses.filter((_: any, i: number) => i !== addressIndex);

      const res = await apiFetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          mobile: editMobile,
          workingRegion: editRegion,
          preferredLanguage: editLanguage,
          avatarUrl: editAvatar,
          savedAddresses: updatedAddresses
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        setSelectedAddressIndex((prev) => Math.min(prev, Math.max(0, updatedAddresses.length - 1)));
        toast.success("Address removed successfully!");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to remove address");
      }
    } catch (err) {
      toast.error("Error removing address");
    }
  };

  // AI Disease Scan function
  const handleAIScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setDetectWorkflowStep("analyzing");
    setAnalyzingStageIndex(0);

    // Dynamic timer to simulate 7 progress stages
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

      // We ensure the user experiences the processing stages for at least 10 seconds total
      setTimeout(async () => {
        clearInterval(stageInterval);
        setIsScanning(false);
        if (res.ok) {
          const data = await res.json();
          setScanResult(data);
          
          // Refresh diagnosis history list
          const historyRes = await apiFetch("/api/customer/disease-detection/history");
          if (historyRes.ok) {
            const hData = await historyRes.json();
            setScansHistory(hData.reports);
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

  // Specialist Consultation requests
  const handleRequestConsultation = async (reportId: string) => {
    try {
      setIsPaymentProcessing(true);
      
      const res = await apiFetch("/api/customer/consultations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId })
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Failed to initiate consultation payment.");
        setIsPaymentProcessing(false);
        return;
      }

      const orderData = await res.json();
      await loadRazorpayScript();

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "AgriCare Specialist Consultation",
        description: "Expert Agronomist Consultation Fee",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await apiFetch("/api/customer/consultations/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                reportId
              })
            });

            if (verifyRes.ok) {
              const data = await verifyRes.json();
              toast.success("Consultation fee paid successfully! Ticket created.");
              setActiveTab("consultations");
              setConsultations(prev => [data.consultation, ...prev]);
              setSelectedConsultation(data.consultation);
              fetchDashboardSummary();
            } else {
              toast.error("Payment verification failed on server.");
            }
          } catch (verifyErr) {
            toast.error("Error verifying consultation payment.");
          } finally {
            setIsPaymentProcessing(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.mobile
        },
        theme: {
          color: "#4CAF50"
        },
        modal: {
          ondismiss: function () {
            setIsPaymentProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Error booking consultation.");
      setIsPaymentProcessing(false);
    }
  };

  const [isSpecialistTyping, setIsSpecialistTyping] = useState(false);

  const handleSendConsultMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultMessage.trim()) return;

    const currentMsg = consultMessage;
    try {
      const res = await apiFetch(`/api/customer/consultations/${selectedConsultation._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConsultation((prev: any) => ({ ...prev, chatHistory: data.chatHistory }));
        setConsultMessage("");

        // Trigger agronomist simulated typing and response
        setIsSpecialistTyping(true);
        setTimeout(async () => {
          setIsSpecialistTyping(false);
          let expertReply = "I am carefully examining your leaf photos and symptoms. Let me compile the best organic and chemical treatment instructions for you.";
          
          if (currentMsg.toLowerCase().includes("organic") || currentMsg.toLowerCase().includes("సేంద్రీయ")) {
            expertReply = "For organic care, prepare a spray using Neem Oil (10ml) mixed with water. Apply thoroughly once every 5-7 days.";
          } else if (currentMsg.toLowerCase().includes("contagious") || currentMsg.toLowerCase().includes("వ్యాపిస్తుందా")) {
            expertReply = "Yes, leaf diseases spread easily. Remove and destroy heavily affected leaves immediately to protect adjacent stalks.";
          } else if (currentMsg.toLowerCase().includes("rain") || currentMsg.toLowerCase().includes("వర్షం")) {
            expertReply = "Avoid spraying during rainfall as it washes off the fungicides. Pick a dry, sunny morning instead.";
          } else if (currentMsg.toLowerCase().includes("recover") || currentMsg.toLowerCase().includes("కోలుకోవడానికి")) {
            expertReply = "If you apply the recommended treatment schedules, you should see new healthy green sprouts in 10-14 days.";
          }

          const replyRes = await apiFetch(`/api/customer/consultations/${selectedConsultation._id}/message/mock-specialist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: expertReply })
          });
          if (replyRes.ok) {
            const replyData = await replyRes.json();
            setSelectedConsultation((prev: any) => ({ ...prev, chatHistory: replyData.chatHistory }));
          }
        }, 2000);
      }
    } catch (err) {
      toast.error("Failed to send chat message");
    }
  };

  // Simulated Voice Message trigger
  const triggerVoiceMessage = () => {
    setIsVoiceRecording(true);
    toast.info("Recording voice message...");
    setTimeout(() => {
      setIsVoiceRecording(false);
      setConsultMessage(language === "en" ? "🔊 Voice Query (0:12) — [Simulated Recording]" : "🔊 వాయిస్ ప్రశ్న (0:12) — [రికార్డింగ్ సిమ్యులేషన్]");
      toast.success("Voice message recorded successfully!");
    }, 3000);
  };

  const handleRateSpecialist = async (rating: number) => {
    try {
      const res = await apiFetch(`/api/customer/consultations/${selectedConsultation._id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConsultation(data.consultation);
        toast.success("Thank you for rating our specialist!");
      }
    } catch (err) {
      toast.error("Error submitting rating");
    }
  };

  const submitDetailedRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingTargetConsultation) return;

    try {
      const res = await apiFetch(`/api/customer/consultations/${ratingTargetConsultation._id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: specialistRating })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state list
        setConsultations(prev => prev.map(c => c._id === ratingTargetConsultation._id ? data.consultation : c));
        setSelectedConsultation(data.consultation);
        setIsRatingModalOpen(false);
        setWrittenReview("");
        toast.success(language === "en" ? "Review submitted successfully! Consultation resolved." : "సమీక్ష సమర్పించబడింది! సంప్రదింపు విజయవంతంగా పరిష్కరించబడింది.");
      } else {
        toast.error("Failed to close consultation ticket.");
      }
    } catch (err) {
      toast.error("Error submitting feedback reviews.");
    }
  };

  // Support ticket actions
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/customer/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTicketTitle, description: newTicketDesc, imageUrls: newTicketImage ? [newTicketImage] : [] })
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(prev => [data.ticket, ...prev]);
        toast.success("Support ticket created!");
        setNewTicketTitle("");
        setNewTicketDesc("");
        setNewTicketImage("");
      }
    } catch (err) {
      toast.error("Error creating support ticket");
    }
  };

  const handleSendTicketMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    try {
      const res = await apiFetch(`/api/customer/tickets/${selectedTicket._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: ticketMessage })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket((prev: any) => ({ ...prev, chatHistory: data.chatHistory }));
        setTicketMessage("");
      }
    } catch (err) {
      toast.error("Error sending ticket message");
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/api/customer/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" })
      });
      if (res.ok) {
        const data = await res.json();
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(data.ticket);
        }
        setTickets(prev => prev.map(t => t._id === ticketId ? data.ticket : t));
        toast.success("Ticket closed.");
      }
    } catch (err) {
      toast.error("Error closing ticket");
    }
  };

  // Cart / Shopping actions
  const handleAddToCart = async (productId: string, quantity = 1) => {
    try {
      const res = await apiFetch("/api/customer/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity })
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
        toast.success("Product added to cart!");
      }
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    try {
      const res = await apiFetch(`/api/customer/cart/${productId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
        toast.success("Removed from cart");
      }
    } catch (err) {
      toast.error("Error removing item");
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    try {
      const res = await apiFetch("/api/customer/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist);
        toast.success("Added to Wishlist!");
      }
    } catch (err) {
      toast.error("Failed to add to wishlist");
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const res = await apiFetch(`/api/customer/wishlist/${productId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist);
        toast.success("Removed from wishlist");
      }
    } catch (err) {
      toast.error("Error removing from wishlist");
    }
  };

  const handleMoveWishlistToCart = async (productId: string) => {
    await handleAddToCart(productId);
    await handleRemoveFromWishlist(productId);
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "KISAN20") {
      setAppliedDiscount(0.2); // 20% off
      toast.success("Coupon KISAN20 applied! 20% discount applied.");
    } else {
      toast.error("Invalid coupon code");
    }
  };

  // Real Razorpay Checkout logic
  const handleCheckoutSubmit = async () => {
    if ((profileData?.savedAddresses || []).length === 0) {
      toast.error("Please add a delivery address in your Profile first!");
      setActiveTab("profile");
      return;
    }

    try {
      setIsPaymentProcessing(true);
      const res = await apiFetch("/api/customer/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product._id,
            quantity: item.quantity
          })),
          couponCode: couponCode
        })
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Failed to create order on server.");
        setIsPaymentProcessing(false);
        return;
      }

      const orderData = await res.json();
      await loadRazorpayScript();

      const deliveryAddress = profileData?.savedAddresses[selectedAddressIndex];
      const formattedAddress = `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`;

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "AgriCare Marketplace",
        description: "Purchase Fertilisers & Seeds",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await apiFetch("/api/customer/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                items: cart.map(item => ({
                  product: item.product,
                  quantity: item.quantity,
                  price: item.product.price
                })),
                deliveryAddress: formattedAddress,
                totalAmount: orderData.finalAmount,
                paymentMethod: "Razorpay Checkout"
              })
            });

            if (verifyRes.ok) {
              const data = await verifyRes.json();
              setCheckoutReceipt(data);
              setCart([]);
              setAppliedDiscount(0);
              setCheckoutStep("success");
              toast.success("Payment Received! Order placed successfully.");
              fetchDashboardSummary();
            } else {
              toast.error("Payment verification failed on server.");
            }
          } catch (verifyErr) {
            toast.error("Error verifying payment.");
          } finally {
            setIsPaymentProcessing(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.mobile
        },
        theme: {
          color: "#4CAF50"
        },
        modal: {
          ondismiss: function () {
            setIsPaymentProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Error starting checkout payment.");
      setIsPaymentProcessing(false);
    }
  };

  // Order management
  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/customer/orders/${orderId}/cancel`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.order);
        }
        toast.success("Order cancelled and refund initiated.");
      }
    } catch (err) {
      toast.error("Error cancelling order");
    }
  };

  const handleReturnOrder = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/customer/orders/${orderId}/return`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.order);
        }
        toast.success("Return request submitted.");
      }
    } catch (err) {
      toast.error("Error requesting return");
    }
  };

  // Live support floating chat
  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSupportChatLog(prev => [...prev, { sender: 'farmer', text: supportMessage }]);
    const currentMessage = supportMessage;
    setSupportMessage("");

    // Mock live response
    setTimeout(() => {
      let reply = "I've logged your query. Our agricultural specialists are looking into it. Please stand by.";
      if (currentMessage.toLowerCase().includes("seed")) {
        reply = "Seeds normally take 3-5 days to deliver. If there is a delay, please share your order number and we will resolve it immediately.";
      } else if (currentMessage.toLowerCase().includes("disease")) {
        reply = "For crop diseases, try using our 'AI Disease Detection' tab for instant diagnosis, or request an agronomist consult.";
      }
      setSupportChatLog(prev => [...prev, { sender: 'support', text: reply }]);
    }, 1500);
  };

  // Subtotal helper
  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleLogoutClick = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Customer Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "FARMER") {
    return null;
  }

  // Left Sidebar and Top bar items
  const menuItems = [
    { id: "overview" as TabType, label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "profile" as TabType, label: "Farms & Profile", icon: UserIcon },
    { id: "detect" as TabType, label: "AI Disease Detection", icon: ScanLine },
    { id: "consultations" as TabType, label: "Agronomist Consultations", icon: MessageSquare },
    { id: "tickets" as TabType, label: "Support Tickets", icon: TicketIcon },
    { id: "marketplace" as TabType, label: "Marketplace Shop", icon: Store },
    { id: "cart" as TabType, label: "Shopping Cart", icon: ShoppingCart },
    { id: "orders" as TabType, label: "My Orders", icon: Package },
    { id: "payments" as TabType, label: "Payments Logs", icon: CreditCard },
    { id: "crop-history" as TabType, label: "Crop Care History", icon: History },
    { id: "weather" as TabType, label: "Weather Forecast", icon: CloudSun },
    { id: "wishlist" as TabType, label: "My Wishlist", icon: Heart },
    { id: "help-support" as TabType, label: "Help & Live Support", icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="w-68 h-full border-r border-border bg-card hidden lg:flex flex-col justify-between p-4 flex-shrink-0">
        <div className="flex flex-col justify-between h-full overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-border pb-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <span className="font-bold text-[15px] tracking-tight text-foreground block leading-none">AgriCare</span>
                <span className="text-[10px] text-muted-foreground mt-1 block">Farmer Portal</span>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-brand text-brand-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {translations[language][item.id + "_menu"] || item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 border border-border/40 rounded-lg bg-muted/20">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold leading-none text-foreground truncate">{user.name}</p>
                <p className="mt-1 text-[9px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogoutClick}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
              {translations[language].exitPortal || "Exit Portal"}
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY DRAWER */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-sm">
          <div className="w-64 bg-card h-full p-4 flex flex-col justify-between border-r border-border animate-in slide-in-from-left">
            <div className="flex flex-col h-full overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex justify-between items-center pb-4 border-b border-border mb-4">
                <span className="font-bold text-md text-brand">AgriCare Menu</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-muted rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-brand text-brand-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {translations[language][item.id + "_menu"] || item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <button
              onClick={handleLogoutClick}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              {translations[language].exitPortal || "Exit Portal"}
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 h-full flex flex-col overflow-hidden pb-16 lg:pb-0">
        
        {/* HEADER */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/85 backdrop-blur px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-muted rounded-md lg:hidden">
              <Menu className="h-5.5 w-5.5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selection */}
            <button
              onClick={() => setLanguage(prev => prev === "en" ? "te" : "en")}
              className="flex items-center gap-1 text-xs font-bold border border-brand/20 bg-brand/5 text-brand px-3 py-1.5 rounded-full hover:bg-brand/10 transition-all cursor-pointer shadow-soft"
            >
              🌐 {translations[language].toggleLanguage}
            </button>
          </div>
        </header>

        {/* MAIN DYNAMIC CONTENT ROUTER VIEW */}
        <main className="flex-grow p-4 md:p-6 overflow-y-auto no-scrollbar bg-muted/20">
          {loadingSection ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-brand" />
                <p className="text-xs text-muted-foreground animate-pulse">Fetching details...</p>
              </div>
            </div>
          ) : (
            <>
              {/* ======================================= */}
              {/* TAB 1: OVERVIEW */}
              {/* ======================================= */}
              {activeTab === "overview" && dashboardData && (
                <div className="space-y-6">
                  {/* Welcome Card */}
                  <div className="bg-gradient-to-r from-brand to-brand-secondary rounded-2xl p-6 text-brand-foreground shadow-lift relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center pr-6 hidden md:flex">
                      <Sparkles className="h-48 w-48" />
                    </div>
                    <span className="eyebrow bg-white/20 text-white border-0">{translations[language].harvestAdvisory}</span>
                    <h1 className="text-2xl md:text-3xl font-extrabold mt-3 text-white">{translations[language].welcomeTitle.replace("{name}", user.name)}</h1>
                    <p className="mt-2 text-sm text-white/90 max-w-xl">
                      {translations[language].welcomeSubtitle.replace("{count}", String(farms.length))}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setActiveTab("detect")} className="bg-white text-brand text-xs font-bold rounded-lg px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer">
                        <ScanLine className="h-4 w-4" /> {translations[language].scanLeaves}
                      </button>
                      <button onClick={() => setActiveTab("marketplace")} className="bg-brand-soft text-brand-foreground text-xs font-bold rounded-lg px-4 py-2.5 hover:bg-brand-soft/80 transition-colors flex items-center gap-1.5 cursor-pointer">
                        <Store className="h-4 w-4" /> {translations[language].visitStore}
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions Grid */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-muted-foreground tracking-wider uppercase">{translations[language].quickActions}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Scan Crop", icon: Camera, color: "bg-emerald-50 text-emerald-700", tab: "detect", key: "actionScan" },
                        { label: "Raise Ticket", icon: TicketIcon, color: "bg-blue-50 text-blue-700", tab: "tickets", key: "actionTicket" },
                        { label: "Chat Specialist", icon: MessageSquare, color: "bg-purple-50 text-purple-700", tab: "consultations", key: "actionChat" },
                        { label: "Buy Products", icon: Store, color: "bg-amber-50 text-amber-700", tab: "marketplace", key: "actionBuy" }
                      ].map((action, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTab(action.tab as TabType)}
                          className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-soft hover:shadow-card hover:border-brand/40 transition-all text-left cursor-pointer"
                        >
                          <div className={`p-2.5 rounded-lg ${action.color}`}>
                            <action.icon className="h-5 w-5" />
                          </div>
                          <span className="font-bold text-xs tracking-tight">{translations[language][action.key] || action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weather & Active Counts Row */}
                  <div className="grid md:grid-cols-3 gap-5">
                    {/* Weather card */}
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <CloudSun className="h-5 w-5 text-brand" />
                          <span className="font-bold text-sm">Hyperlocal Weather</span>
                        </div>
                        <button onClick={() => setActiveTab("weather")} className="text-xs text-brand font-semibold hover:underline">Full 7-Day Forecast &rarr;</button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-3xl font-extrabold text-foreground">{dashboardData.weatherInfo.temp}</p>
                          <p className="text-xs text-muted-foreground mt-1">Humidity: {dashboardData.weatherInfo.humidity} | Wind: {dashboardData.weatherInfo.windSpeed}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] uppercase">
                            {dashboardData.weatherInfo.rainForecast}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-xl flex gap-2.5 items-start">
                        <AlertTriangle className="h-4.5 w-4.5 text-warning shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-warning-foreground font-semibold">{dashboardData.weatherInfo.alerts}</p>
                      </div>
                    </div>

                    {/* Stats counters */}
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Package className="h-5 w-5 text-brand" />
                        <span className="font-bold text-sm">Pending Actions</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div onClick={() => setActiveTab("tickets")} className="p-3 bg-muted/30 border border-border rounded-xl cursor-pointer hover:border-brand/40">
                          <p className="text-2xl font-extrabold text-foreground">{dashboardData.openTicketsCount}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground mt-1">Open Tickets</p>
                        </div>
                        <div onClick={() => setActiveTab("consultations")} className="p-3 bg-muted/30 border border-border rounded-xl cursor-pointer hover:border-brand/40">
                          <p className="text-2xl font-extrabold text-foreground">{dashboardData.activeConsultationsCount}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground mt-1">Active Consults</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Crop Health Summary & Recent Scans */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-3">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <span className="font-bold text-sm">Recent Leaf Diagnoses</span>
                        <button onClick={() => setActiveTab("crop-history")} className="text-xs text-brand font-semibold hover:underline">View History &rarr;</button>
                      </div>
                      {dashboardData.recentReports?.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-6 text-center">No crop disease reports submitted yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {dashboardData.recentReports.map((r: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 border border-border/60 rounded-xl hover:bg-muted/10">
                              <div className="flex items-center gap-3">
                                <img src={r.imageUrl} alt="" className="h-10 w-10 object-cover rounded-lg border" />
                                <div>
                                  <h4 className="font-bold text-xs">{r.cropName}</h4>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">AI Prediction: {r.aiPrediction?.disease}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                r.status === 'RESOLVED' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recommended Products */}
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-3">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <span className="font-bold text-sm">Recommended Farming Inputs</span>
                        <button onClick={() => setActiveTab("marketplace")} className="text-xs text-brand font-semibold hover:underline">Shop Store &rarr;</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {dashboardData.recommendedProducts?.map((p: any, i: number) => (
                          <div key={i} className="p-3 border border-border/60 rounded-xl hover:bg-muted/10 flex flex-col justify-between">
                            <img src={p.imageUrl} alt="" className="h-18 w-full object-cover rounded-lg border mb-2" />
                            <div>
                              <p className="font-bold text-[11px] truncate">{p.name}</p>
                              <p className="text-brand font-extrabold text-xs mt-1">₹{p.price}</p>
                            </div>
                            <button onClick={() => handleAddToCart(p._id)} className="w-full mt-2 bg-brand/10 text-brand text-[10px] font-bold py-1.5 rounded-lg hover:bg-brand hover:text-white transition-colors">
                              + Add to Cart
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 2: PROFILE & FARMS */}
              {/* ======================================= */}
              {activeTab === "profile" && profileData && (
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Edit profile Card */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2 space-y-6">
                    <h3 className="font-bold text-md border-b border-border pb-2">Profile & Farm Info</h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground block mb-1">Farmer Name</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground block mb-1">Mobile Number</label>
                          <input
                            type="tel"
                            required
                            value={editMobile}
                            onChange={(e) => setEditMobile(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground block mb-1">Farming Region</label>
                          <input
                            type="text"
                            value={editRegion}
                            onChange={(e) => setEditRegion(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                            placeholder="e.g. Pune, Maharashtra"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground block mb-1">Preferred Language</label>
                          <select
                            value={editLanguage}
                            onChange={(e) => setEditLanguage(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                          >
                            {["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali"].map(lang => (
                              <option key={lang} value={lang}>{lang}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button type="submit" className="bg-brand text-brand-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors">
                        Save Profile Details
                      </button>
                    </form>

                    {/* Change Password Form */}
                    <div className="pt-4 border-t border-border space-y-4">
                      <h4 className="font-bold text-sm text-foreground">Update Security Credentials</h4>
                      <form onSubmit={handleChangePassword} className="grid md:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground block mb-1">Current Password</label>
                          <input
                            type="password"
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground block mb-1">New Password</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                          />
                        </div>
                        <button type="submit" className="bg-muted text-foreground border border-border text-xs font-bold py-2 rounded-lg hover:bg-muted/75 transition-colors">
                          Change Password
                        </button>
                      </form>
                    </div>

                    {/* Manage Saved Addresses */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <h4 className="font-bold text-sm text-foreground">Registered Delivery Addresses</h4>
                      {(profileData?.savedAddresses || []).length === 0 ? (
                        <div className="p-3 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                          No delivery addresses yet. Add one below.
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-3">
                          {(profileData?.savedAddresses || []).map((addr: any, i: number) => (
                            <div key={i} className="p-3 border border-border rounded-xl text-xs space-y-1 relative">
                              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[8px] font-bold uppercase">{addr.label}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(i)}
                                className="absolute top-2 left-2 p-1 rounded hover:bg-muted text-red-500"
                                aria-label="Delete address"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <p className="font-semibold text-foreground">{addr.street}</p>
                              <p className="text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Address Form */}
                      <form onSubmit={handleAddAddress} className="bg-muted/30 p-4 border border-border/80 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-foreground">Add New Address</p>
                        <div className="space-y-2">
                          <input
                            type="text"
                            required
                            placeholder="Street / Village Location"
                            value={newAddressStreet}
                            onChange={(e) => setNewAddressStreet(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
                          />
                          <input
                            type="text"
                            required
                            placeholder="City"
                            value={newAddressCity}
                            onChange={(e) => setNewAddressCity(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="State"
                            value={newAddressState}
                            onChange={(e) => setNewAddressState(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Pincode"
                            value={newAddressPincode}
                            onChange={(e) => setNewAddressPincode(e.target.value)}
                            inputMode="numeric"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                          />
                          <select
                            value={newAddressLabel}
                            onChange={(e) => setNewAddressLabel(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                          >
                            <option value="Home">Home (House)</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other (Another)</option>
                          </select>
                          <button type="submit" className="w-full bg-brand text-brand-foreground text-xs font-bold py-2.5 rounded-lg hover:bg-brand/90 transition-colors">
                            Add Address
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Add Multiple Farms Card */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-5">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="font-bold text-sm">Farm Plots ({farms.length})</span>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
                      {farms.map((f: any, i: number) => (
                        <div key={i} className="p-3 border border-border rounded-xl text-xs flex justify-between items-center hover:bg-muted/10">
                          <div>
                            <p className="font-bold text-foreground">{f.name}</p>
                            <p className="text-muted-foreground mt-0.5">{f.size} Acres | {f.soilType}</p>
                            <p className="text-brand font-semibold mt-1">Active crop: {f.cropType}</p>
                          </div>
                          <button onClick={() => handleDeleteFarm(f._id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Farm form */}
                    <form onSubmit={handleAddFarm} className="border-t border-border pt-4 space-y-3">
                      <p className="text-xs font-bold text-foreground">Register New Field Plot</p>
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="Plot Name"
                          value={newFarmName}
                          onChange={(e) => setNewFarmName(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            required
                            placeholder="Size (Acres)"
                            value={newFarmSize}
                            onChange={(e) => setNewFarmSize(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                          />
                          <select
                            value={newFarmSoil}
                            onChange={(e) => setNewFarmSoil(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                          >
                            {["Black Clay", "Red Sandy", "Alluvial soil", "Laterite soil"].map(soil => (
                              <option key={soil} value={soil}>{soil}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={newFarmCrop}
                            onChange={(e) => setNewFarmCrop(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                          >
                            {Object.keys(cropConfig).map(crop => (
                              <option key={crop} value={crop}>{crop}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Location Details"
                            value={newFarmLoc}
                            onChange={(e) => setNewFarmLoc(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                          />
                        </div>
                        <button type="submit" className="w-full bg-brand text-brand-foreground text-xs font-bold py-2 rounded-lg hover:bg-brand/90 transition-colors">
                          Register Farm Plot
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 3: AI DISEASE DETECTION */}
              {/* ======================================= */}
              {activeTab === "detect" && (
                <div className="space-y-6">
                  {/* Step Progress Indicator */}
                  {detectWorkflowStep !== "category" && (
                    <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap justify-between items-center text-[10px] md:text-xs font-semibold text-muted-foreground shadow-soft max-w-2xl mx-auto">
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
                          <div key={step.id} className="flex items-center gap-1.5 md:gap-2 my-1">
                            <span className={`h-6 w-6 rounded-full flex items-center justify-center font-extrabold text-[10px] transition-all ${
                              isCurrent ? "bg-brand text-brand-foreground scale-110 shadow-sm" : isCompleted ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"
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
                              // Auto-load draft answers for this crop if exists
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
                            className="bg-card border border-border rounded-2xl p-4 hover:border-brand hover:shadow-md transition-all text-left group cursor-pointer"
                          >
                            <div className="aspect-square rounded-xl overflow-hidden mb-3 border border-border">
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
                      {/* Top Crop Header */}
                      <div className="flex items-center gap-4 bg-muted/10 p-4 rounded-xl border border-border">
                        <img
                          src={cropConfig[selectedCrop as keyof typeof cropConfig]?.image}
                          alt=""
                          className="w-14 h-14 object-cover rounded-lg border flex-shrink-0"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-foreground">{selectedCrop} {translations[language].progressInfo}</h3>
                          <p className="text-[10px] text-muted-foreground">Answer questions to help our AI diagnose accurately</p>
                        </div>
                      </div>

                      {/* 15-Field Crop Form */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* 1. Crop Variety Dropdown */}
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

                        {/* 2. Crop Age */}
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

                        {/* 3. Growth Stage */}
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

                        {/* 4. Affected Plant Part */}
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

                        {/* 5. Observed Symptoms Check Chips (Multi select) */}
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
                                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                                    isSelected
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

                        {/* 6. Disease Duration */}
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

                        {/* 7. Soil Type */}
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

                        {/* 8. Irrigation Method */}
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

                        {/* 9. Weather Conditions */}
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

                        {/* 10. Previous Fertilizer Used */}
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

                        {/* 11. Fertilizer Application Date */}
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

                        {/* 12. Pesticide/Fungicide Used */}
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

                        {/* 13. Previous Spray Date */}
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

                        {/* 14. Percentage of Crop Affected Slider */}
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

                        {/* 15. Additional Comments */}
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

                      {/* Sticky Bottom Actions */}
                      <div className="flex gap-4 border-t border-border pt-4 mt-6">
                        <button
                          onClick={() => setDetectWorkflowStep("category")}
                          className="flex-1 border border-border text-foreground hover:bg-muted text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5"
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
                          className="flex-1 bg-brand text-brand-foreground hover:bg-brand/95 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5"
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

                      {/* Image Slots Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[0, 1, 2, 3, 4].map((index) => {
                          const img = uploadedImages[index];
                          return (
                            <div key={index} className="border border-border/80 rounded-xl relative aspect-square bg-muted/30 flex items-center justify-center overflow-hidden border-dashed hover:border-brand/40 transition-colors">
                              {img ? (
                                <>
                                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                                  
                                  {/* Overlay quality score */}
                                  <span className={`absolute bottom-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded text-white ${
                                    img.quality.score >= 70 ? "bg-success/80" : "bg-red-500/80"
                                  }`}>
                                    {img.quality.score}% Score
                                  </span>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => {
                                      const nextImages = uploadedImages.filter((_, i) => i !== index);
                                      setUploadedImages(nextImages);
                                      if (nextImages.length > 0) {
                                        setCropImageUrl(nextImages[0].url);
                                      }
                                    }}
                                    className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md cursor-pointer"
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

                      {/* Action Triggers */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-3">
                        {/* Gallery Upload */}
                        <label className="flex-1 bg-muted/40 hover:bg-muted/70 border border-border text-foreground font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
                          <Upload className="h-4.5 w-4.5 text-brand" /> {translations[language].gallery}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (uploadedImages.length + files.length > 5) {
                                toast.warning(language === "en" ? "You can only upload up to 5 images." : "మీరు గరిష్టంగా 5 చిత్రాలను మాత్రమే అప్‌లోడ్ చేయగలరు.");
                                return;
                              }
                              files.forEach(file => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  // Mock quality check
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
                                    setCropImageUrl(next[0].url);
                                    return next;
                                  });
                                };
                                reader.readAsDataURL(file);
                              });
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Camera trigger simulation */}
                        <button
                          onClick={() => {
                            if (uploadedImages.length >= 5) {
                              toast.warning("All slots filled.");
                              return;
                            }
                            const samples = cropConfig[selectedCrop as keyof typeof cropConfig]?.samples || [];
                            const randomSample = samples[Math.floor(Math.random() * samples.length)]?.url;
                            const isBlurry = Math.random() < 0.15;
                            const score = isBlurry ? 58 : 94;
                            const quality = {
                              blur: isBlurry,
                              brightness: true,
                              focus: true,
                              resolution: "2048x1536",
                              score
                            };
                            setUploadedImages(prev => {
                              const next = [...prev, { url: randomSample, quality }];
                              setCropImageUrl(next[0].url);
                              return next;
                            });
                            toast.success(language === "en" ? "Camera photo captured!" : "కెమెరా ఫోటో తీయబడింది!");
                          }}
                          className="flex-grow bg-muted/40 hover:bg-muted/70 border border-border text-foreground font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Camera className="h-4.5 w-4.5 text-brand" /> {translations[language].camera}
                        </button>
                      </div>

                      {/* AI Quality check summary panel */}
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
                                  <span className={`font-bold rounded px-1.5 py-0.5 text-[10px] ${
                                    img.quality.score >= 70 ? "bg-success/10 text-success" : "bg-red-50 text-red-600 animate-pulse"
                                  }`}>
                                    {img.quality.score}% Quality
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Blur Warning Alert */}
                          {uploadedImages.some(img => img.quality.blur) && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] leading-relaxed flex gap-2">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                              <p>{translations[language].blurryWarning}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sticky Bottom Actions */}
                      <div className="flex gap-4 border-t border-border pt-4 mt-6">
                        <button
                          onClick={() => setDetectWorkflowStep("info")}
                          className="flex-grow border border-border text-foreground hover:bg-muted text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                        >
                          <ChevronLeft className="h-4.5 w-4.5" /> {translations[language].back}
                        </button>
                        <button
                          onClick={handleAIScan}
                          disabled={uploadedImages.length === 0}
                          className="flex-grow bg-brand text-brand-foreground hover:bg-brand/95 text-xs font-bold py-2.5 rounded-lg disabled:opacity-55 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="h-4.5 w-4.5" /> {translations[language].submitAnalysis}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: AI Analysis Processing screen */}
                  {detectWorkflowStep === "analyzing" && (
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-soft max-w-xl mx-auto text-center space-y-6 py-16 relative">
                      {/* Scanning visual wheel */}
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

                      {/* Progress stages list */}
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
                              <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                isActive ? "bg-brand text-brand-foreground scale-110 animate-pulse" : isDone ? "bg-success text-white" : "bg-muted text-muted-foreground/60"
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
                    const recommendedProducts = scanResult.recommendedProductsList || dashboardData?.recommendedProducts || [];
                    
                    return (
                      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {/* Left and Middle Content: Diagnosis Report details */}
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2 space-y-5 text-left">
                          {/* Header */}
                          <div className="flex justify-between items-center border-b border-border pb-3">
                            <span className="px-2.5 py-0.5 rounded bg-brand/10 text-brand text-[9px] font-bold uppercase tracking-wider">AI Diagnosis Report</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-brand">
                              <Sparkles className="h-4 w-4" /> {((details.confidence || 0.82) * 100).toFixed(0)}% Confidence
                            </span>
                          </div>

                          {/* Title and Crop details */}
                          <div>
                            <h3 className="font-extrabold text-lg text-foreground leading-tight">{details.disease}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="bg-muted text-muted-foreground text-[8px] font-bold px-2 py-0.5 rounded uppercase">Crop: {selectedCrop}</span>
                              <span className="bg-red-50 text-red-600 text-[8px] font-bold px-2 py-0.5 rounded uppercase">Severity: High</span>
                              <span className="bg-yellow-50 text-yellow-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase">Risk: Moderate</span>
                            </div>
                          </div>

                          {/* Causes, Symptoms, and Preventions */}
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

                          {/* Chemical and Organic Recommendations */}
                          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                            {/* Chemical */}
                            <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl space-y-2">
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

                            {/* Organic */}
                            <div className="p-3 bg-emerald-50/50 border border-emerald-200/50 rounded-xl space-y-2">
                              <p className="font-bold text-emerald-600 text-xs">Organic Remedy alternatives</p>
                              <p className="text-[11px] text-foreground leading-relaxed font-medium">{details.organicTreatment}</p>
                              <p className="text-[10px] text-muted-foreground"><span className="font-bold">Application Method:</span> {details.applicationMethod}</p>
                            </div>
                          </div>

                          {/* Horizontal recommended products carousel slider */}
                          <div className="border-t border-border pt-4 space-y-3">
                            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Store className="h-4 w-4 text-brand" /> {translations[language].buyProducts}
                            </h4>
                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory">
                              {(recommendedProducts || []).map((prod: any) => (
                                <div key={prod._id} className="min-w-[170px] w-[170px] flex-shrink-0 p-3 border border-border rounded-xl flex flex-col justify-between hover:bg-muted/10 transition-colors text-left bg-card snap-start">
                                  <div>
                                    <img src={prod.imageUrl} alt="" className="w-full aspect-[4/3] object-cover rounded-lg border mb-2" />
                                    <h5 className="font-bold text-[10px] text-foreground truncate leading-tight">{prod.name}</h5>
                                    <p className="text-[10px] text-brand font-extrabold mt-1">₹{prod.price}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      handleAddToCart(prod._id);
                                      toast.success(`${prod.name} added to cart!`);
                                    }}
                                    className="w-full mt-3 bg-brand text-brand-foreground font-bold text-[9px] py-1.5 rounded-lg hover:bg-brand/90 flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <ShoppingCart className="h-3 w-3" /> Add to Cart
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Panel: Specialist Booking Prompts & Assignment Details */}
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft text-left space-y-4 flex flex-col justify-between h-full">
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
                                        <span key={idx} className="bg-success/15 text-success text-[9px] font-bold px-2 py-0.5 rounded-md">
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
                                  }
                                  setActiveTab("consultations");
                                }}
                                className="w-full bg-brand text-brand-foreground hover:bg-brand/95 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <MessageSquare className="h-4.5 w-4.5" />
                                Ask Specialist Questions
                              </button>
                            </div>
                          ) : reportDoc.status === 'ASSIGNED' ? (
                            <div className="space-y-4">
                              <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3">
                                <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
                                Review in Progress
                              </h4>
                              
                              <div className="bg-indigo-50/50 border border-indigo-200/50 p-4 rounded-xl text-center py-6 space-y-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-sm mx-auto">
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
                                <p className="text-[11px] text-indigo-700 leading-relaxed max-w-[200px] mx-auto pt-1 font-medium">
                                  Reviewing your leaf symptoms. Your certified prescription is being compiled.
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  const matchingConsult = consultations.find(c => c.reportId?._id === reportDoc._id || c.reportId === reportDoc._id);
                                  if (matchingConsult) {
                                    setSelectedConsultation(matchingConsult);
                                  }
                                  setActiveTab("consultations");
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <MessageSquare className="h-4.5 w-4.5" />
                                Open Live Consult Chat
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-4">
                                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1">
                                  <UserIcon className="h-4.5 w-4.5 text-brand" /> {translations[language].consultSpecialistLabel}
                                </h4>
                                <div className="bg-yellow-50/50 border border-yellow-200/50 p-4 rounded-xl space-y-3.5 font-medium">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-yellow-800 font-semibold">{translations[language].specialistFee}</span>
                                    <span className="text-sm font-extrabold text-yellow-800">₹499</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] text-yellow-700">
                                    <span>{translations[language].responseTime}</span>
                                    <span className="font-bold">Under 2 hours</span>
                                  </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                  <p className="font-bold text-muted-foreground tracking-wide uppercase">{translations[language].consultIncludes}</p>
                                  <ul className="space-y-2">
                                    {[
                                      translations[language].consultBenefit1,
                                      translations[language].consultBenefit2,
                                      translations[language].consultBenefit3,
                                      translations[language].consultBenefit4
                                    ].map((b, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                                        <span className="text-[11px] text-foreground font-medium leading-tight">{b}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className="space-y-2 pt-4 border-t border-border">
                                <button
                                  onClick={() => handleRequestConsultation(reportDoc._id)}
                                  disabled={isPaymentProcessing}
                                  className="w-full bg-brand text-brand-foreground hover:bg-brand/95 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <CreditCard className="h-4.5 w-4.5" /> {translations[language].payConsultFee}
                                </button>
                              </div>
                            </>
                          )}

                          <div className="pt-2 border-t border-border">
                            <button
                              onClick={() => setDetectWorkflowStep("category")}
                              className="w-full border border-border text-foreground hover:bg-muted font-bold text-xs py-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                            >
                              Re-Scan Crop Category
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 4: CONSULTATIONS */}
              {/* ======================================= */}
              {activeTab === "consultations" && (
                <div className="grid md:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
                  {/* Column 1: Consultations List */}
                  <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col h-full col-span-1">
                    <h3 className="font-extrabold text-xs border-b border-border pb-2.5 mb-3 uppercase tracking-wider text-foreground">Expert Conversations</h3>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-1">
                      {consultations.length === 0 ? (
                        <div className="text-center py-8 space-y-3">
                          <p className="text-xs text-muted-foreground">{translations[language].historyTitle.split(" ")[0]} No active consultations.</p>
                          <div className="border border-border p-3 rounded-xl bg-brand/5 space-y-2 text-left">
                            <h4 className="font-bold text-[10px] text-brand uppercase">Agronomist Package (₹499)</h4>
                            <ul className="text-[9px] text-muted-foreground space-y-1">
                              <li>• Direct chat with certified expert</li>
                              <li>• Custom spray schedule layout</li>
                              <li>• Certified treatment PDF download</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        consultations.map((c: any, i: number) => (
                          <div
                            key={i}
                            onClick={() => setSelectedConsultation(c)}
                            className={`p-3 border rounded-xl cursor-pointer transition-all text-left relative ${
                              selectedConsultation && selectedConsultation._id === c._id
                                ? "bg-brand/5 border-brand shadow-sm"
                                : "border-border hover:bg-muted/10"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-xs text-foreground">Dr. {c.specialistId?.name || "Agronomist"}</h4>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                c.status === 'COMPLETED' ? 'bg-success/15 text-success' : 'bg-brand/15 text-brand'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">Speciality: {c.specialistId?.specialization || "Crop Protection"}</p>
                            <p className="text-[9px] text-muted-foreground mt-2">Booked on: {new Date(c.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 2 & 3: WhatsApp-like Chat Conversation panel */}
                  <div className="bg-card border border-border rounded-2xl flex flex-col h-full md:col-span-2 overflow-hidden shadow-soft">
                    {selectedConsultation ? (
                      <>
                        {/* Agronomist Live Header */}
                        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/10 shrink-0">
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-xs text-foreground">Dr. {selectedConsultation.specialistId?.name || "Agronomist Expert"}</h3>
                              {selectedConsultation.status !== 'COMPLETED' && (
                                <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" title="Online" />
                              )}
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {selectedConsultation.specialistId?.specialization || "Crop Protection"} | ★ {selectedConsultation.specialistId?.rating || 5.0}
                            </p>
                          </div>
                          {selectedConsultation.status !== 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setRatingTargetConsultation(selectedConsultation);
                                setIsRatingModalOpen(true);
                              }}
                              className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                            >
                              Resolve & Rate
                            </button>
                          )}
                        </div>

                        {/* Messages panel */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                          {/* System Ticket Notice */}
                          <div className="text-center py-2">
                            <span className="bg-muted px-3 py-1 rounded-full text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                              SECURE SYSTEM CHAT CREATED
                            </span>
                          </div>

                          {selectedConsultation.chatHistory?.map((msg: any, i: number) => {
                            const isMe = msg.senderId?._id === user.id || msg.senderId === user.id || (msg.senderId?.role === 'CUSTOMER');
                            return (
                              <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-xs px-3.5 py-2.5 rounded-2xl text-xs space-y-1 text-left shadow-soft ${
                                  isMe ? "bg-brand text-brand-foreground" : "bg-card border border-border text-foreground"
                                }`}>
                                  <p className="leading-relaxed font-medium">{msg.message}</p>
                                  <div className="flex items-center justify-end gap-1 mt-1 shrink-0">
                                    <p className={`text-[8px] ${isMe ? "text-brand-foreground/75" : "text-muted-foreground"}`}>
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {isMe && (
                                      <span className="text-[9px] text-brand-foreground/80 font-bold">✓✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Typing indicator */}
                          {isSpecialistTyping && (
                            <div className="flex justify-start">
                              <div className="bg-card border border-border px-4 py-2.5 rounded-2xl text-xs text-muted-foreground flex items-center gap-1.5 shadow-soft">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" />
                                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.2s]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.4s]" />
                                <span className="text-[10px] font-semibold">Dr. Specialist is typing...</span>
                              </div>
                            </div>
                          )}

                          <div ref={consultChatEndRef} />
                        </div>

                        {/* Quick Replies Bar */}
                        {selectedConsultation.status !== 'COMPLETED' && (
                          <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-muted/10 border-t border-border no-scrollbar shrink-0">
                            {[
                              translations[language].quickReply1,
                              translations[language].quickReply2,
                              translations[language].quickReply3,
                              translations[language].quickReply4
                            ].map((qr, idx) => (
                              <button
                                key={idx}
                                onClick={() => setConsultMessage(qr)}
                                className="px-3 py-1 rounded-full border border-border text-[9px] font-bold text-muted-foreground hover:border-brand hover:text-brand bg-card flex-shrink-0 cursor-pointer"
                              >
                                {qr}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Message Form */}
                        {selectedConsultation.status !== 'COMPLETED' ? (
                          <form onSubmit={handleSendConsultMessage} className="p-3 border-t border-border flex gap-2 items-center bg-card shrink-0">
                            <button
                              type="button"
                              onClick={triggerVoiceMessage}
                              className={`p-2.5 rounded-lg border border-border ${isVoiceRecording ? "bg-red-50 text-red-600 animate-pulse" : "bg-card text-muted-foreground hover:text-brand"}`}
                              title="Record Voice Note"
                            >
                              <Mic className="h-4 w-4" />
                            </button>
                            
                            <label className="p-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-brand cursor-pointer">
                              <Camera className="h-4 w-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={() => {
                                  setConsultMessage(language === "en" ? "📷 Image Attached [Simulated Upload]" : "📷 చిత్రం అటాచ్ చేయబడింది [సిమ్యులేషన్ అప్‌లోడ్]");
                                }}
                              />
                            </label>

                            <input
                              type="text"
                              required
                              value={consultMessage}
                              onChange={(e) => setConsultMessage(e.target.value)}
                              placeholder={translations[language].chatPlaceholder}
                              className="flex-grow rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                            />
                            
                            <button type="submit" className="p-2.5 bg-brand text-white rounded-lg hover:bg-brand/90 cursor-pointer">
                              <Send className="h-4 w-4" />
                            </button>
                          </form>
                        ) : (
                          <div className="p-4 bg-muted/20 text-center text-xs text-muted-foreground border-t border-border shrink-0 font-bold">
                            {translations[language].submitFeedback.split(" ")[0]} Consultation resolved and closed.
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center flex-col text-center space-y-3">
                        <MessageSquare className="h-8 w-8 text-muted-foreground animate-bounce" />
                        <h4 className="font-bold text-xs text-foreground">Select a Chat Consultation</h4>
                        <p className="text-[10px] text-muted-foreground max-w-xs">
                          Book crop leaf review diagnostics or select an ongoing conversation from the left to talk in real-time.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Column 4: Timeline and Specialist Report Summary */}
                  <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col h-full col-span-1 overflow-y-auto no-scrollbar text-left space-y-5">
                    {selectedConsultation ? (
                      <>
                        {/* 1. Timeline */}
                        <div className="space-y-3">
                          <h4 className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider">{translations[language].timelineHeader}</h4>
                          <div className="relative pl-5 space-y-4.5 border-l-2 border-brand-soft ml-1.5 text-[10px]">
                            {[
                              { label: translations[language].timelinePayment, active: true },
                              { label: translations[language].timelineTicket, active: true },
                              { label: translations[language].timelineAdmin, active: selectedConsultation.status !== 'PENDING' },
                              { label: translations[language].timelineAssigned, active: !!selectedConsultation.specialistId },
                              { label: translations[language].timelineReviewing, active: selectedConsultation.status === 'ACTIVE' || selectedConsultation.status === 'COMPLETED' },
                              { label: translations[language].timelineChat, active: selectedConsultation.chatHistory?.length > 0 },
                              { label: translations[language].timelineReport, active: !!selectedConsultation.prescription },
                              { label: translations[language].timelineCompleted, active: selectedConsultation.status === 'COMPLETED' }
                            ].map((step, idx) => (
                              <div key={idx} className="relative">
                                <span className={`absolute -left-[27px] top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                                  step.active ? "bg-brand border-brand text-white" : "bg-card border-border text-muted-foreground"
                                }`}>
                                  <span className="h-1 w-1 rounded-full bg-current" />
                                </span>
                                <span className={`font-bold ${step.active ? "text-foreground" : "text-muted-foreground/60"}`}>{step.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Prescription Advice Breakdown - 11 Detail items */}
                        {selectedConsultation.prescription ? (
                          <div className="border-t border-border pt-4 space-y-4">
                            <h4 className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider">Certified Treatment Report</h4>
                            
                            <div className="space-y-3 text-[11px] leading-relaxed">
                              {/* 1. Confirmed Disease */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">1. Confirmed Disease</p>
                                <p className="text-muted-foreground mt-0.5">{selectedConsultation.prescription.advice.split(":")[0] || "Crop Pathogen Infection"}</p>
                              </div>

                              {/* 2. Recommended Chemical Fertilizer */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">2. Chemical Fertilizer Recommendation</p>
                                <p className="text-muted-foreground mt-0.5">NPK 19:19:19 & Micronutrient spray</p>
                              </div>

                              {/* 3. Recommended Pesticide/Fungicide */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">3. Recommended Fungicide/Pesticide</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedConsultation.prescription.medicines?.map((m: string, idx: number) => (
                                    <span key={idx} className="bg-brand/10 text-brand text-[9px] font-bold px-1.5 py-0.5 rounded">{m}</span>
                                  ))}
                                </div>
                              </div>

                              {/* 4. Organic remedies */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">4. Organic Alternatives</p>
                                <p className="text-muted-foreground mt-0.5">Neem Seed Kernel Extract (5% NSKE) spray</p>
                              </div>

                              {/* 5. Dosage instruction */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">5. Dosage Instruction</p>
                                <p className="text-muted-foreground mt-0.5">2.5 grams fungicide powder per liter water</p>
                              </div>

                              {/* 6. Spray timeline schedule */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">6. Spray Timeline Schedule</p>
                                <p className="text-muted-foreground mt-0.5">Apply immediately. Repeat foliar spray after 7 days if spots remain.</p>
                              </div>

                              {/* 7. Application method */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">7. Application Method</p>
                                <p className="text-muted-foreground mt-0.5">High volume foliar spray ensuring thorough coverage of leaves.</p>
                              </div>

                              {/* 8. Irrigation changes */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">8. Irrigation Adjustments</p>
                                <p className="text-muted-foreground mt-0.5">Switch to drip irrigation. Do not irrigate in late evenings.</p>
                              </div>

                              {/* 9. Recovery period */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">9. Recovery Period</p>
                                <p className="text-success font-semibold mt-0.5">10 to 14 days</p>
                              </div>

                              {/* 10. Safety precautions */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">10. Safety Precautions</p>
                                <p className="text-muted-foreground mt-0.5">{translations[language].safetyLabel}: Wear mask & eye protection.</p>
                              </div>

                              {/* 11. Next Follow-up date */}
                              <div className="bg-muted/10 p-2.5 border rounded-lg">
                                <p className="font-bold text-foreground">11. {translations[language].followUp}</p>
                                <p className="text-brand font-bold mt-0.5">July 08, 2026 (10 Days follow up check)</p>
                              </div>
                            </div>

                            {/* Download Action */}
                            <button
                              onClick={() => {
                                toast.success(language === "en" ? "Treatment PDF report downloaded successfully!" : "చికిత్స నివేదిక PDF విజయవంతంగా డౌన్‌లోడ్ చేయబడింది!");
                              }}
                              className="w-full bg-brand text-brand-foreground font-bold text-xs py-2 rounded-lg hover:bg-brand/90 transition-colors flex items-center justify-center gap-1 mt-3"
                            >
                              <FileText className="h-4 w-4" /> {translations[language].downloadPDF}
                            </button>
                          </div>
                        ) : (
                          <div className="border-t border-border pt-4 text-center py-6">
                            <span className="text-[10px] text-muted-foreground italic">Prescription report will be generated after the specialist completes the initial diagnostic analysis.</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-muted-foreground text-xs italic">
                        Select consultation chat to view progress timeline.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 5: TICKETS */}
              {/* ======================================= */}
              {activeTab === "tickets" && (
                <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
                  {/* Create / List Support tickets */}
                  <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col h-full space-y-4">
                    <h3 className="font-bold text-sm border-b border-border pb-2">Support Tickets</h3>
                    
                    {/* Add ticket form */}
                    <form onSubmit={handleCreateTicket} className="space-y-3 bg-muted/20 p-3.5 border rounded-xl text-left">
                      <p className="text-xs font-bold text-foreground">Raise Support Query</p>
                      <input
                        type="text"
                        required
                        placeholder="Ticket Subject Title"
                        value={newTicketTitle}
                        onChange={(e) => setNewTicketTitle(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
                      />
                      <textarea
                        required
                        placeholder="Describe issue (delay, payment, etc.)..."
                        value={newTicketDesc}
                        onChange={(e) => setNewTicketDesc(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none h-18 resize-none"
                      />
                      <button type="submit" className="w-full bg-brand text-brand-foreground text-xs font-bold py-2 rounded-lg hover:bg-brand/90 transition-colors">
                        Submit Support Request
                      </button>
                    </form>

                    {/* Tickets list */}
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
                      {tickets.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No raised tickets log.</p>
                      ) : (
                        tickets.map((t: any, i: number) => (
                          <div
                            key={i}
                            onClick={() => setSelectedTicket(t)}
                            className={`p-3 border rounded-xl cursor-pointer text-left transition-colors relative ${
                              selectedTicket && selectedTicket._id === t._id ? "bg-brand/5 border-brand" : "border-border hover:bg-muted/10"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-xs truncate max-w-32">{t.title}</h4>
                              <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-muted font-bold text-muted-foreground uppercase">{t.status}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">{t.description}</p>
                            <p className="text-[8px] text-muted-foreground mt-2">Opened: {new Date(t.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Ticket messages panel */}
                  <div className="bg-card border border-border rounded-2xl flex flex-col h-full md:col-span-2 overflow-hidden shadow-soft">
                    {selectedTicket ? (
                      <>
                        <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/10 shrink-0">
                          <div>
                            <h3 className="font-bold text-xs text-foreground">{selectedTicket.title}</h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Status: <span className="font-semibold">{selectedTicket.status}</span></p>
                          </div>
                          {selectedTicket.status !== 'CLOSED' && (
                            <button onClick={() => handleCloseTicket(selectedTicket._id)} className="text-xs text-red-600 font-semibold hover:underline">
                              Close Ticket
                            </button>
                          )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                          {selectedTicket.chatHistory?.map((msg: any, i: number) => {
                            const isMe = msg.senderId?._id === user.id || msg.senderId === user.id;
                            return (
                              <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-sm px-4 py-2.5 rounded-xl text-xs text-left ${
                                  isMe ? "bg-brand text-brand-foreground" : "bg-card border border-border text-foreground"
                                }`}>
                                  <p className="leading-relaxed">{msg.message}</p>
                                  <p className={`text-[8px] text-right mt-1 ${isMe ? "text-brand-foreground/70" : "text-muted-foreground"}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={ticketChatEndRef} />
                        </div>

                        {selectedTicket.status !== 'CLOSED' ? (
                          <form onSubmit={handleSendTicketMessage} className="p-3 border-t border-border flex gap-2 items-center bg-card shrink-0">
                            <input
                              type="text"
                              required
                              value={ticketMessage}
                              onChange={(e) => setTicketMessage(e.target.value)}
                              placeholder="Write support reply..."
                              className="flex-grow rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                            />
                            <button type="submit" className="p-2.5 bg-brand text-white rounded-lg hover:bg-brand/90">
                              <Send className="h-4 w-4" />
                            </button>
                          </form>
                        ) : (
                          <div className="p-4 bg-muted/20 text-center text-xs text-muted-foreground border-t border-border shrink-0 font-semibold">
                            This support ticket has been closed.
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center flex-col text-center space-y-3">
                        <TicketIcon className="h-8 w-8 text-muted-foreground animate-bounce" />
                        <h4 className="font-bold text-xs text-foreground">Select a Support Ticket</h4>
                        <p className="text-[10px] text-muted-foreground max-w-xs animate-pulse">
                          Open an existing ticket log or submit a new query to consult customer care in real-time.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 6: MARKETPLACE */}
              {/* ======================================= */}
              {activeTab === "marketplace" && (
                <div className="space-y-6">
                  {/* Filters / Search header */}
                  <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-soft">
                    <div className="flex flex-grow w-full md:max-w-md items-center gap-2 border border-border px-3 py-2 rounded-lg bg-background">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search seeds, inputs, equipment..."
                        value={marketSearch}
                        onChange={(e) => setMarketSearch(e.target.value)}
                        className="w-full text-xs outline-none bg-transparent"
                      />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto whitespace-nowrap pb-1 md:pb-0">
                      {["", "Seeds & Saplings", "Fertilizers", "Equipment"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setMarketCategory(cat)}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            marketCategory === cat ? "bg-brand text-brand-foreground border-brand" : "bg-card border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {cat || "All Categories"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {products.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-xs text-muted-foreground">
                        No products match your search.
                      </div>
                    ) : (
                      products.map((prod) => (
                        <div key={prod._id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                          <div className="cursor-pointer" onClick={() => setSelectedProduct(prod)}>
                            <img src={prod.imageUrl} alt="" className="aspect-[4/3] w-full object-cover border-b" />
                            <div className="p-3.5 text-left space-y-1.5">
                              <span className="text-[9px] font-bold text-brand uppercase">{prod.category}</span>
                              <h4 className="font-bold text-xs text-foreground truncate">{prod.name}</h4>
                              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{prod.description}</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-foreground pt-1">
                                <span>₹{prod.price}</span>
                                <span className="flex items-center gap-0.5 text-[10px] text-gold">★ {prod.rating}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 border-t border-border flex gap-2">
                            <button
                              onClick={() => handleAddToWishlist(prod._id)}
                              className="p-2 border border-border rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            >
                              <Heart className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleAddToCart(prod._id)}
                              className="flex-grow bg-brand text-brand-foreground font-bold text-xs py-2 rounded-lg hover:bg-brand/90 flex items-center justify-center gap-1.5"
                            >
                              <ShoppingCart className="h-4 w-4" /> Add to Cart
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Product Details Modal Overlay */}
                  {selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                      <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto no-scrollbar p-6 space-y-5 animate-in zoom-in-95 relative text-left">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full">
                          <X className="h-5.5 w-5.5" />
                        </button>

                        <div className="grid md:grid-cols-2 gap-4">
                          <img src={selectedProduct.imageUrl} alt="" className="w-full object-cover rounded-xl border aspect-square" />
                          <div className="space-y-3">
                            <span className="text-xs font-bold text-brand uppercase">{selectedProduct.category}</span>
                            <h3 className="font-extrabold text-lg text-foreground">{selectedProduct.name}</h3>
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                              <span>₹{selectedProduct.price}</span>
                              <span className="text-gold">★ {selectedProduct.rating}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                            <p className="text-xs font-semibold text-muted-foreground">In Stock: <span className="text-foreground">{selectedProduct.stock} units</span></p>
                          </div>
                        </div>

                        {/* Reviews list */}
                        <div className="border-t border-border pt-4 space-y-3">
                          <h4 className="font-bold text-sm text-foreground">Farmer Feedback Reviews ({selectedProduct.reviews?.length || 0})</h4>
                          {selectedProduct.reviews?.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No feedback reviews submitted yet.</p>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                              {selectedProduct.reviews.map((rev: any, idx: number) => (
                                <div key={idx} className="p-3 bg-muted/20 border border-border rounded-xl text-xs space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-foreground">{rev.name}</span>
                                    <span className="text-gold">★ {rev.rating}</span>
                                  </div>
                                  <p className="text-muted-foreground italic">{rev.comment}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              handleAddToCart(selectedProduct._id);
                              setSelectedProduct(null);
                            }}
                            className="flex-grow bg-brand text-brand-foreground font-bold text-xs py-3 rounded-lg hover:bg-brand/90 flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="h-4.5 w-4.5" /> Buy / Add to Shopping Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 7: SHOPPING CART & CHECKOUT */}
              {/* ======================================= */}
              {activeTab === "cart" && (
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Cart items list */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2 space-y-4 text-left">
                    <h3 className="font-bold text-md border-b border-border pb-2">Your Shopping Cart</h3>
                    
                    {cart.length === 0 ? (
                      <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-3">
                        <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                        <p>Your cart is empty. Check out our seeds and fertilizers.</p>
                        <button onClick={() => setActiveTab("marketplace")} className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-lg">Browse Shop</button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4">
                            <div className="flex items-center gap-4">
                              <img src={item.product?.imageUrl} alt="" className="h-16 w-16 object-cover rounded-lg border" />
                              <div>
                                <h4 className="font-bold text-xs">{item.product?.name}</h4>
                                <p className="text-brand font-bold text-xs mt-1">₹{item.product?.price} each</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                              <div className="flex items-center border border-border rounded-lg text-xs overflow-hidden">
                                <button
                                  onClick={() => handleAddToCart(item.product?._id, -1)}
                                  className="px-2 py-1 bg-muted hover:bg-muted/70 font-bold"
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <span className="px-3 font-semibold">{item.quantity}</span>
                                <button
                                  onClick={() => handleAddToCart(item.product?._id, 1)}
                                  className="px-2 py-1 bg-muted hover:bg-muted/70 font-bold"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemoveFromCart(item.product?._id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary / Simulated payment sheet */}
                  {cart.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4 text-left">
                      <h4 className="font-bold text-sm border-b border-border pb-2">Order Price Summary</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal Price</span>
                          <span className="font-semibold">₹{getCartTotal()}</span>
                        </div>
                        {appliedDiscount > 0 && (
                          <div className="flex justify-between text-success">
                            <span>Coupon Discount (20% off)</span>
                            <span>-₹{getCartTotal() * appliedDiscount}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Delivery fee</span>
                          <span className="text-success font-semibold">FREE</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
                          <span>Grand Total</span>
                          <span className="text-brand">₹{getCartTotal() - (getCartTotal() * appliedDiscount)}</span>
                        </div>
                      </div>

                      {/* Coupon input */}
                      <div className="pt-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter KISAN20 for discount"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none uppercase"
                          />
                          <button onClick={applyCoupon} className="bg-muted text-foreground border border-border text-xs font-bold px-3 rounded-lg hover:bg-muted/70">
                            Apply
                          </button>
                        </div>
                      </div>

                      {/* Delivery Address check */}
                      <div className="pt-2 space-y-2">
                        <p className="text-xs font-bold text-foreground">Select Delivery Address</p>
                        {profileData?.savedAddresses?.length === 0 ? (
                          <p className="text-[10px] text-red-500 font-semibold">Please register an address in the Profile tab first!</p>
                        ) : (
                          <select
                            value={selectedAddressIndex}
                            onChange={(e) => setSelectedAddressIndex(Number(e.target.value))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                          >
                            {profileData.savedAddresses.map((addr: any, idx: number) => (
                              <option key={idx} value={idx}>{addr.label}: {addr.street}, {addr.city}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <button onClick={handleCheckoutSubmit} className="w-full bg-brand text-brand-foreground font-bold text-xs py-3 rounded-lg hover:bg-brand/90 transition-colors flex items-center justify-center gap-2">
                        Proceed to Secure Checkout
                      </button>
                    </div>
                  )}

                  {/* Checkout Success screen */}
                  {checkoutStep === "success" && checkoutReceipt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 text-center space-y-4 animate-in zoom-in-95">
                        <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto shadow-sm">
                          <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <h3 className="font-extrabold text-lg text-foreground">Order Placed Successfully!</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          Thank you for buying from AgriCare. Your transaction ID is {checkoutReceipt.payment?.transactionId}.
                        </p>
                        <div className="border border-border p-3.5 rounded-xl text-left text-xs bg-muted/10 space-y-1">
                          <p className="font-bold text-foreground">Order Ref: {checkoutReceipt.order?._id}</p>
                          <p className="text-muted-foreground">Delivery Address: {checkoutReceipt.order?.deliveryAddress}</p>
                          <p className="text-brand font-bold mt-1">Total Paid: ₹{checkoutReceipt.order?.totalAmount}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCheckoutStep("cart");
                              setCheckoutReceipt(null);
                              setActiveTab("orders");
                            }}
                            className="flex-grow bg-brand text-brand-foreground font-bold text-xs py-2.5 rounded-lg hover:bg-brand/90"
                          >
                            Track Shipment Status
                          </button>
                          <button
                            onClick={() => {
                              setCheckoutStep("cart");
                              setCheckoutReceipt(null);
                            }}
                            className="bg-muted text-foreground border border-border font-bold text-xs py-2.5 rounded-lg px-4 hover:bg-muted/80"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 8: ORDER TIMELINE & MANAGEMENT */}
              {/* ======================================= */}
              {activeTab === "orders" && (
                <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
                  {/* Orders List */}
                  <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col h-full">
                    <h3 className="font-bold text-sm border-b border-border pb-2 mb-3">Order History Log</h3>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
                      {orders.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-12">No orders placed yet.</p>
                      ) : (
                        orders.map((o: any, i: number) => (
                          <div
                            key={i}
                            onClick={() => setSelectedOrder(o)}
                            className={`p-3.5 border rounded-xl cursor-pointer text-left transition-colors relative ${
                              selectedOrder && selectedOrder._id === o._id ? "bg-brand/5 border-brand" : "border-border hover:bg-muted/10"
                            }`}
                          >
                            <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold uppercase absolute top-3 right-3">{o.status}</span>
                            <h4 className="font-bold text-xs truncate max-w-40">{o.items[0]?.product} {o.items.length > 1 ? `+${o.items.length - 1} more` : ""}</h4>
                            <p className="text-[10px] text-brand font-bold mt-1">₹{o.totalAmount}</p>
                            <p className="text-[8px] text-muted-foreground mt-2">Ordered on: {new Date(o.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Order Details & Tracking */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2 flex flex-col h-full overflow-y-auto no-scrollbar text-left space-y-5">
                    {selectedOrder ? (
                      <>
                        <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
                          <div>
                            <h3 className="font-extrabold text-sm text-foreground">Order Ref: {selectedOrder._id}</h3>
                            <p className="text-[9px] text-muted-foreground mt-0.5">Purchased on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                          </div>
                          {selectedOrder.status === 'PENDING' && (
                            <button onClick={() => handleCancelOrder(selectedOrder._id)} className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-100">
                              Cancel Order
                            </button>
                          )}
                          {selectedOrder.status === 'DELIVERED' && (
                            <button onClick={() => handleReturnOrder(selectedOrder._id)} className="bg-muted text-foreground border border-border text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-muted/70">
                              Request Return
                            </button>
                          )}
                        </div>

                        {/* Invoice download simulation */}
                        {selectedOrder.invoiceUrl && (
                          <div className="p-3 bg-muted/20 border border-border rounded-xl flex justify-between items-center shrink-0">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1"><FileText className="h-4 w-4 text-brand" /> Invoice PDF available</span>
                            <button
                              onClick={() => {
                                toast.info("Opening simulated printer dialog...");
                                window.print();
                              }}
                              className="text-xs text-brand font-bold hover:underline flex items-center gap-1"
                            >
                              <Printer className="h-3.5 w-3.5" /> Print Receipt
                            </button>
                          </div>
                        )}

                        {/* Items summary */}
                        <div className="space-y-2 shrink-0">
                          <p className="text-xs font-bold text-muted-foreground">Order Items</p>
                          <div className="space-y-1 text-xs">
                            {selectedOrder.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between p-2.5 bg-muted/10 border rounded-lg">
                                <span>{item.product} (x{item.quantity})</span>
                                <span className="font-semibold">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery address */}
                        <div className="space-y-1 text-xs shrink-0">
                          <p className="font-bold text-muted-foreground">Shipping Address:</p>
                          <p className="text-foreground">{selectedOrder.deliveryAddress}</p>
                        </div>

                        {/* Tracking timeline */}
                        <div className="space-y-4 pt-2 flex-grow">
                          <p className="text-xs font-bold text-muted-foreground">Order Logistics Timeline</p>
                          <div className="relative pl-6 space-y-5 border-l-2 border-border ml-2 text-xs">
                            {[
                              { label: "Order Placed", desc: "Order details received and verified.", active: true },
                              { label: "Packed & Sealed", desc: "Package handed over to logistics vendor.", active: ['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) },
                              { label: "Out for Delivery", desc: "Out for transit with last mile shipper.", active: ['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) },
                              { label: "Delivered", desc: "Parcel received at farm gate address.", active: selectedOrder.status === 'DELIVERED' }
                            ].map((step, idx) => (
                              <div key={idx} className="relative">
                                <span className={`absolute -left-[30px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 ${
                                  step.active ? "bg-brand border-brand text-white" : "bg-card border-border text-muted-foreground"
                                }`}>
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                </span>
                                <div>
                                  <h4 className={`font-bold ${step.active ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</h4>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{step.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center flex-col text-center space-y-3">
                        <Package className="h-8 w-8 text-muted-foreground animate-pulse" />
                        <h4 className="font-bold text-xs text-foreground">Select an Order to Track</h4>
                        <p className="text-[10px] text-muted-foreground max-w-xs">
                          Check delivery logs, raise return tickets, or print invoices by selecting a transaction ID from the left.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 9: PAYMENTS */}
              {/* ======================================= */}
              {activeTab === "payments" && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft text-left space-y-4">
                  <h3 className="font-bold text-md border-b border-border pb-2">Razorpay Transaction Logs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold">
                          <th className="py-2.5">Transaction ID</th>
                          <th className="py-2.5">Date</th>
                          <th className="py-2.5">Method</th>
                          <th className="py-2.5">Amount</th>
                          <th className="py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">No payments record found.</td>
                          </tr>
                        ) : (
                          payments.map((p, i) => (
                            <tr key={i} className="border-b border-border/60 hover:bg-muted/10">
                              <td className="py-3 font-semibold text-foreground">{p.transactionId}</td>
                              <td className="py-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 font-semibold text-muted-foreground">{p.paymentMethod}</td>
                              <td className="py-3 font-bold text-foreground">₹{p.amount}</td>
                              <td className="py-3 text-right">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  p.status === 'SUCCESSFUL' ? 'bg-success/15 text-success' : 'bg-red-15 text-red-600'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 10: CROP HISTORY */}
              {/* ======================================= */}
              {activeTab === "crop-history" && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft text-left space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
                    <div>
                      <h3 className="font-extrabold text-md text-foreground">{translations[language].historyTitle}</h3>
                      <p className="text-[10px] text-muted-foreground">Manage your past diagnostic scans, consultant details, receipts, and order purchases.</p>
                    </div>
                  </div>

                  {/* Search and Category Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder={translations[language].historySearchPlaceholder}
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="flex-grow rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand shadow-sm"
                    />
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {[
                        { id: "all", label: translations[language].all },
                        { id: "reports", label: translations[language].reports },
                        { id: "consults", label: translations[language].consults },
                        { id: "orders", label: translations[language].orders },
                        { id: "payments", label: translations[language].payments }
                      ].map((pill) => (
                        <button
                          key={pill.id}
                          onClick={() => setHistoryFilter(pill.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                            historyFilter === pill.id
                              ? "bg-brand border-brand text-brand-foreground shadow-sm"
                              : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Unified Aggregated Logs List */}
                  <div className="space-y-3">
                    {(() => {
                      const list: any[] = [];

                      // Add Scan Reports
                      if (historyFilter === "all" || historyFilter === "reports") {
                        scansHistory.forEach(h => {
                          const hasSpecialist = !!h.specialistDiagnosis;
                          const isAssigned = h.status === 'ASSIGNED';
                          let badgeText = "AI Report";
                          let badgeColor = "bg-brand/10 text-brand border-brand/20";
                          let subtitleText = `Diagnosed: ${h.aiPrediction?.disease || "Leaf Spot Disease"} (${(h.aiPrediction?.confidence * 100 || 0.94).toFixed(0)}% Conf)`;
                          
                          if (hasSpecialist) {
                            badgeText = "Specialist Diagnosed";
                            badgeColor = "bg-success/15 text-success border-success/20";
                            subtitleText = `Diagnosed by Specialist: ${h.specialistDiagnosis.disease}`;
                          } else if (isAssigned) {
                            badgeText = "Assigned for Review";
                            badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                            subtitleText = h.assignedSpecialistId?.name 
                              ? `Under review by Dr. ${h.assignedSpecialistId.name}`
                              : "Under review by specialist";
                          }

                          list.push({
                            type: "report",
                            title: h.cropName,
                            subtitle: subtitleText,
                            date: new Date(h.createdAt),
                            raw: h,
                            badge: badgeText,
                            badgeColor: badgeColor,
                            imageUrl: h.imageUrl
                          });
                        });
                      }

                      // Add Consultations
                      if (historyFilter === "all" || historyFilter === "consults") {
                        consultations.forEach(c => {
                          list.push({
                            type: "consult",
                            title: `Agronomist Consult: Dr. ${c.specialistId?.name || "Expert"}`,
                            subtitle: `Speciality: ${c.specialistId?.specialization || "Crop Protection"} | Status: ${c.status}`,
                            date: new Date(c.createdAt),
                            raw: c,
                            badge: "Consultation",
                            badgeColor: "bg-yellow-50 text-yellow-700 border-yellow-200"
                          });
                        });
                      }

                      // Add Marketplace Orders
                      if (historyFilter === "all" || historyFilter === "orders") {
                        orders.forEach(o => {
                          list.push({
                            type: "order",
                            title: `Order Purchased: ${o.items[0]?.product || "Agri Product"}`,
                            subtitle: `Amount: ₹${o.totalAmount} | Delivery Status: ${o.status}`,
                            date: new Date(o.createdAt),
                            raw: o,
                            badge: "Marketplace Order",
                            badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
                          });
                        });
                      }

                      // Add Payment Logs
                      if (historyFilter === "all" || historyFilter === "payments") {
                        payments.forEach(p => {
                          list.push({
                            type: "payment",
                            title: `Razorpay Payment ID: ${p.transactionId}`,
                            subtitle: `Amount Paid: ₹${p.amount} | Status: ${p.status}`,
                            date: new Date(p.createdAt),
                            raw: p,
                            badge: "Payment Log",
                            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
                          });
                        });
                      }

                      // Sort by Date Descending
                      let filteredList = list.sort((a, b) => b.date.getTime() - a.date.getTime());

                      // Apply Text Search Filter
                      if (historySearch.trim()) {
                        const searchLower = historySearch.toLowerCase();
                        filteredList = filteredList.filter(item =>
                          item.title.toLowerCase().includes(searchLower) ||
                          item.subtitle.toLowerCase().includes(searchLower) ||
                          item.badge.toLowerCase().includes(searchLower)
                        );
                      }

                      if (filteredList.length === 0) {
                        return (
                          <div className="text-center py-16 text-muted-foreground space-y-2">
                            <History className="h-8 w-8 text-muted-foreground/45 mx-auto animate-pulse" />
                            <p className="text-xs">No matching history records found in this category.</p>
                          </div>
                        );
                      }

                      return filteredList.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4 hover:bg-muted/10 transition-colors bg-card">
                          <div className="flex items-center gap-4 text-left">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="h-14 w-14 object-cover rounded-lg border flex-shrink-0" />
                            ) : (
                              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-lg border border-border">
                                {item.type === "consult" ? "👨‍🔬" : item.type === "order" ? "📦" : "💳"}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-xs text-foreground">{item.title}</h4>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase ${item.badgeColor}`}>
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                              <p className="text-[9px] text-muted-foreground">Log Date: {item.date.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Item Action Triggers */}
                          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                            {item.type === "report" && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedCrop(item.raw.cropName);
                                    setCropImageUrl(item.raw.imageUrl);
                                    setScanResult(null);
                                    setDetectWorkflowStep("info");
                                    setActiveTab("detect");
                                  }}
                                  className="bg-brand/10 text-brand border border-brand/20 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition-colors cursor-pointer"
                                >
                                  Re-Scan Crop
                                </button>
                                <button
                                  onClick={() => {
                                    setScanResult(item.raw);
                                    setSelectedCrop(item.raw.cropName);
                                    setDetectWorkflowStep("report");
                                    setActiveTab("detect");
                                  }}
                                  className="bg-muted text-foreground border border-border font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                                >
                                  Open Report
                                </button>
                              </>
                            )}

                            {item.type === "consult" && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedConsultation(item.raw);
                                    setActiveTab("consultations");
                                  }}
                                  className="bg-brand/10 text-brand border border-brand/20 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition-colors cursor-pointer"
                                >
                                  Enter Chat
                                </button>
                                {item.raw.prescription && (
                                  <button
                                    onClick={() => {
                                      toast.success("Treatment plan PDF downloaded successfully!");
                                    }}
                                    className="bg-muted text-foreground border border-border font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                                  >
                                    Download PDF
                                  </button>
                                )}
                              </>
                            )}

                            {item.type === "order" && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(item.raw);
                                  setActiveTab("orders");
                                }}
                                className="bg-brand/10 text-brand border border-brand/20 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition-all cursor-pointer"
                              >
                                Track Package
                              </button>
                            )}

                            {item.type === "payment" && (
                              <button
                                onClick={() => {
                                  toast.info(`Receipt ID: ${item.raw.transactionId}. Printer simulation started.`);
                                  window.print();
                                }}
                                className="bg-muted text-foreground border border-border font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-muted/70 transition-all cursor-pointer"
                              >
                                Print Invoice
                              </button>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 11: WEATHER */}
              {/* ======================================= */}
              {activeTab === "weather" && weather && (
                <div className="space-y-6 text-left">
                  {/* Current conditions */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-soft grid md:grid-cols-2 gap-6 items-center">
                    <div>
                      <span className="eyebrow bg-blue-50 text-blue-700 border-0">Current Conditions</span>
                      <h3 className="text-3xl font-extrabold text-foreground mt-3">{weather.current.temp}°C</h3>
                      <p className="text-sm font-semibold text-muted-foreground mt-1">{weather.current.condition} | Region: {weather.location}</p>
                      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                        <div className="p-2.5 bg-muted/20 border border-border rounded-xl">
                          <p className="text-muted-foreground">Humidity</p>
                          <p className="font-bold mt-0.5">{weather.current.humidity}%</p>
                        </div>
                        <div className="p-2.5 bg-muted/20 border border-border rounded-xl">
                          <p className="text-muted-foreground">Wind</p>
                          <p className="font-bold mt-0.5">{weather.current.windSpeed} km/h</p>
                        </div>
                        <div className="p-2.5 bg-muted/20 border border-border rounded-xl">
                          <p className="text-muted-foreground">Pincode</p>
                          <p className="font-bold mt-0.5">{weather.current.pincode}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-3">
                      <p className="text-xs font-bold text-blue-700 flex items-center gap-1"><CloudSun className="h-4 w-4" /> Rainfall Forecast</p>
                      <p className="text-xs text-blue-900 leading-relaxed font-semibold">{weather.current.rainForecast}</p>
                      <div className="pt-2 border-t border-blue-100/50">
                        <p className="text-[10px] text-muted-foreground">Weekly Advisory Advice:</p>
                        <p className="text-[11px] font-medium text-foreground mt-1">Avoid chemical fertilizer application within 2 hours of forecasted showers to prevent surface runoff washing inputs.</p>
                      </div>
                    </div>
                  </div>

                  {/* 5-day Forecast */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
                    <h4 className="font-bold text-sm text-foreground">Weekly Forecast Schedule</h4>
                    <div className="grid grid-cols-5 gap-3 text-center">
                      {weather.forecast.map((f: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted/10 border border-border rounded-xl space-y-2">
                          <p className="font-bold text-xs text-muted-foreground">{f.day}</p>
                          <p className="text-lg font-extrabold text-foreground">{f.temp}°C</p>
                          <p className="text-[9px] font-semibold text-brand">{f.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advisory Alerts */}
                  {weather.alerts?.map((alert: any, idx: number) => (
                    <div key={idx} className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex gap-3 items-start">
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs text-warning-foreground">{alert.title}</h4>
                        <p className="text-[11px] leading-relaxed text-warning-foreground mt-1">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 12: WISHLIST */}
              {/* ======================================= */}
              {activeTab === "wishlist" && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft text-left space-y-4">
                  <h3 className="font-bold text-md border-b border-border pb-2">My Saved Products</h3>
                  {wishlist.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-12">No products saved in Wishlist.</p>
                  ) : (
                    <div className="space-y-4">
                      {wishlist.map((item) => (
                        <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4">
                          <div className="flex items-center gap-4">
                            <img src={item.imageUrl} alt="" className="h-16 w-16 object-cover rounded-lg border" />
                            <div>
                              <h4 className="font-bold text-xs text-foreground">{item.name}</h4>
                              <p className="text-brand font-bold text-xs mt-1">₹{item.price}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleRemoveFromWishlist(item._id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded border border-border"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleMoveWishlistToCart(item._id)}
                              className="flex-grow bg-brand text-brand-foreground font-bold text-xs px-4 py-2 rounded-lg hover:bg-brand/90 flex items-center justify-center gap-1.5"
                            >
                              <ShoppingCart className="h-4 w-4" /> Move to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================= */}
              {/* TAB 13: HELP & SUPPORT */}
              {/* ======================================= */}
              {activeTab === "help-support" && (
                <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
                  {/* FAQs Panel */}
                  <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col h-full overflow-y-auto no-scrollbar text-left space-y-4 md:col-span-2">
                    <h3 className="font-bold text-sm border-b border-border pb-2">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                      {[
                        { q: "How accurate is the leaf scanning AI?", a: "The AI disease model averages 94% accuracy and is trained on over 2 million crop leave pathogen samples across agro-climatic zones in India." },
                        { q: "What should I do if my payment fails?", a: "Simulated Razorpay logs transaction errors instantly. If your actual funds are ever debited, our gateway auto-reconciles within 24 hours, or you can submit a support ticket." },
                        { q: "How do I chat with specialists?", a: "Request a consultation for a disease report. An agronomist will be assigned within 10 minutes to chat in real-time." }
                      ].map((faq, idx) => (
                        <div key={idx} className="p-3 bg-muted/20 border border-border/80 rounded-xl space-y-1 text-xs">
                          <p className="font-bold text-foreground">{faq.q}</p>
                          <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Help Support chat */}
                  <div className="bg-card border border-border rounded-2xl flex flex-col h-full overflow-hidden shadow-soft">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/10 shrink-0 text-left">
                      <div>
                        <h3 className="font-bold text-xs text-foreground">Live Customer Chat</h3>
                        <p className="text-[8px] text-muted-foreground mt-0.5">Average reply: 2 mins</p>
                      </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-muted/5 text-left">
                      {supportChatLog.map((chat, idx) => (
                        <div key={idx} className={`flex ${chat.sender === 'farmer' ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs px-3 py-2 rounded-xl text-xs ${
                            chat.sender === 'farmer' ? "bg-brand text-brand-foreground" : "bg-card border border-border text-foreground"
                          }`}>
                            {chat.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendSupportMessage} className="p-3 border-t border-border flex gap-2 items-center bg-card shrink-0">
                      <input
                        type="text"
                        required
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Type message..."
                        className="flex-grow rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none"
                      />
                      <button type="submit" className="p-2 bg-brand text-white rounded-lg hover:bg-brand/90">
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-card border-t border-border flex items-center justify-around z-40 lg:hidden shadow-lift shrink-0">
        {[
          { id: "overview" as TabType, label: "Home", icon: LayoutDashboard },
          { id: "detect" as TabType, label: "Detect", icon: ScanLine },
          { id: "marketplace" as TabType, label: "Shop", icon: Store },
          { id: "orders" as TabType, label: "Orders", icon: Package },
          { id: "profile" as TabType, label: "Profile", icon: UserIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === "overview" && activeTab === "overview");
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1.5 p-2 transition-colors cursor-pointer ${
                isActive ? "text-brand" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-tight">
                {translations[language][tab.id + "_bottom"] || tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Rating Feedback Dialog Modal */}
      {isRatingModalOpen && ratingTargetConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 text-left space-y-4 animate-in zoom-in-95 shadow-lift">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wide flex items-center gap-1">
                <Star className="h-4.5 w-4.5 text-brand" /> {translations[language].ratingTitle}
              </h3>
              <button
                onClick={() => setIsRatingModalOpen(false)}
                className="p-1 hover:bg-muted rounded-md text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitDetailedRating} className="space-y-4 text-xs">
              {/* Row 1: Specialist rating */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">{translations[language].rateSpecialist}</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSpecialistRating(star)}
                      className="p-1 text-gold hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`h-6 w-6 ${specialistRating >= star ? "fill-gold text-gold" : "text-muted-foreground/35"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Treatment Quality rating */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">{translations[language].rateTreatment}</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTreatmentRating(star)}
                      className="p-1 text-gold hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`h-6 w-6 ${treatmentRating >= star ? "fill-gold text-gold" : "text-muted-foreground/35"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Overall Experience rating */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">{translations[language].rateExperience}</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setExperienceRating(star)}
                      className="p-1 text-gold hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`h-6 w-6 ${experienceRating >= star ? "fill-gold text-gold" : "text-muted-foreground/35"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Written review comments */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">{translations[language].writtenReview}</label>
                <textarea
                  rows={3}
                  required
                  value={writtenReview}
                  onChange={(e) => setWrittenReview(e.target.value)}
                  placeholder="Enter details of your rating and comments..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsRatingModalOpen(false)}
                  className="flex-1 border border-border text-foreground hover:bg-muted py-2.5 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand text-brand-foreground hover:bg-brand/95 py-2.5 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Submit & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
