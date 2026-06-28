export const SITE = {
  name: "AgriCare",
  tagline: "AI-powered farming, end to end.",
  description:
    "AgriCare is an enterprise AgriTech platform helping farmers grow smarter with AI disease detection, a trusted marketplace, and expert advisory.",
  email: "hello@agricare.in",
  phone: "+91 80 4567 8900",
  whatsapp: "+91 98765 43210",
  address: "Prestige Tech Park, Outer Ring Road, Bengaluru 560103, India",
};

export type NavItem = {
  label: string;
  to?: string;
  children?: NavItem[];
};

export const NAV_LINKS: NavItem[] = [
  { to: "/", label: "Home" },
  {
    label: "Solutions",
    children: [
      { to: "/ai-disease-detection", label: "AI Disease Detection" },
      { to: "/agriculture-specialists", label: "Agriculture Specialists" },
      { to: "/services", label: "Services" },
    ],
  },
  {
    label: "Marketplace",
    children: [
      { to: "/marketplace", label: "Categories" },
      { to: "/marketplace", label: "Product Listing" },
    ],
  },
  {
    label: "Resources",
    children: [
      { to: "/blog", label: "Blogs" },
      { to: "/success-stories", label: "Success Stories" },
      { to: "/gallery", label: "Gallery" },
      { to: "/videos", label: "Video Library" },
      { to: "/faq", label: "FAQ" },
    ],
  },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
  { to: "/download-app", label: "Download App" },
] as const;

export const IMG = {
  heroDrone:
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=2000&q=80",
  ricefield:
    "https://images.unsplash.com/photo-1530507629858-e3759c1c66f3?auto=format&fit=crop&w=1600&q=80",
  wheat:
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80",
  vegetables:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80",
  fruits:
    "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1600&q=80",
  organic:
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80",
  farmerPhone:
    "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1600&q=80",
  ai:
    "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=1600&q=80",
  specialist:
    "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=1600&q=80",
  marketplace:
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=80",
  warehouse:
    "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1600&q=80",
  equipment:
    "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=1600&q=80",
  delivery:
    "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=1600&q=80",
  weather:
    "https://images.unsplash.com/photo-1561553873-e8491a564fd0?auto=format&fit=crop&w=1600&q=80",
  irrigation:
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1600&q=80",
  farmer1:
    "https://images.unsplash.com/photo-1595437193398-f24279553f4f?auto=format&fit=crop&w=800&q=80",
  farmer2:
    "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=800&q=80",
  farmer3:
    "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80",
  team1: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  team2: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  team3: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
  team4: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
  loginSide:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
  notFound:
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1600&q=80",
};

export const HERO_VIDEO =
  "https://videos.pexels.com/video-files/2933375/2933375-uhd_2560_1440_24fps.mp4";
