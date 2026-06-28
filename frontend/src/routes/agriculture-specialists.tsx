import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Filter, Star, Calendar, MessageSquare, MapPin, Languages } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/agriculture-specialists")({
  head: () => ({
    meta: [
      { title: "Agriculture Specialists — AgriCare" },
      { name: "description", content: "Connect with certified agriculture specialists for personalized consultation and advice." },
      { property: "og:image", content: IMG.specialist },
    ],
  }),
  component: AgricultureSpecialists,
});

const SPECIALISTS = [
  {
    id: 1,
    name: "Dr. Anika Sharma",
    qualification: "Ph.D. in Agronomy",
    experience: "12 years",
    specialization: ["Crop Disease", "Soil Health"],
    languages: ["English", "Hindi", "Punjabi"],
    rating: 4.9,
    reviews: 342,
    image: IMG.team1,
    consultation: "Video & Voice",
    location: "Punjab",
  },
  {
    id: 2,
    name: "Rajesh Patel",
    qualification: "M.Sc. in Horticulture",
    experience: "8 years",
    specialization: ["Vegetables", "Fruits"],
    languages: ["English", "Gujarati", "Marathi"],
    rating: 4.8,
    reviews: 218,
    image: IMG.team2,
    consultation: "Voice & Chat",
    location: "Gujarat",
  },
  {
    id: 3,
    name: "Priya Iyer",
    qualification: "Ph.D. in Plant Pathology",
    experience: "10 years",
    specialization: ["Rice", "Wheat"],
    languages: ["English", "Tamil", "Telugu"],
    rating: 4.95,
    reviews: 456,
    image: IMG.team3,
    consultation: "Video & Voice",
    location: "Tamil Nadu",
  },
  {
    id: 4,
    name: "Vikram Singh",
    qualification: "M.Tech in Agricultural Engineering",
    experience: "7 years",
    specialization: ["Irrigation", "Farm Machinery"],
    languages: ["English", "Hindi"],
    rating: 4.7,
    reviews: 189,
    image: IMG.team4,
    consultation: "Video & Chat",
    location: "Uttar Pradesh",
  },
  {
    id: 5,
    name: "Sunita Devi",
    qualification: "B.Sc. Agriculture",
    experience: "15 years",
    specialization: ["Organic Farming", "Sustainable Agriculture"],
    languages: ["Hindi", "Bhojpuri"],
    rating: 5.0,
    reviews: 120,
    image: IMG.farmer2,
    consultation: "Voice",
    location: "Bihar",
  },
  {
    id: 6,
    name: "Dr. Karthik R.",
    qualification: "Ph.D. in Entomology",
    experience: "9 years",
    specialization: ["Pest Control", "Crop Protection"],
    languages: ["English", "Kannada", "Malayalam"],
    rating: 4.85,
    reviews: 287,
    image: IMG.farmer3,
    consultation: "Video & Voice",
    location: "Karnataka",
  },
];

const CROPS = ["All Crops", "Rice", "Wheat", "Cotton", "Vegetables", "Fruits", "Sugarcane"];
const SPECIALTIES = ["All Specialties", "Crop Disease", "Soil Health", "Irrigation", "Pest Control", "Organic Farming"];

function AgricultureSpecialists() {
  return (
    <>
      <PageHero
        eyebrow="Agriculture Specialists"
        title="Expert advice from certified agronomists."
        description="Connect with India's top agriculture specialists for personalized consultation in your language."
        image={IMG.specialist}
        imageAlt="Agriculture specialist with a farmer"
      />

      <Section>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search specialists by name or expertise..." className="max-w-md" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s.toLowerCase().replace(" ", "-")}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Crop" />
              </SelectTrigger>
              <SelectContent>
                {CROPS.map((c) => (
                  <SelectItem key={c} value={c.toLowerCase().replace(" ", "-")}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SPECIALISTS.map((specialist) => (
            <Card key={specialist.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={specialist.image} alt={specialist.name} />
                      <AvatarFallback>{specialist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{specialist.name}</h3>
                      <p className="text-sm text-muted-foreground">{specialist.qualification}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                    <Star className="h-3 w-3 fill-current" />
                    {specialist.rating}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {specialist.specialization.map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{specialist.experience} experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Languages className="h-4 w-4" />
                    <span>{specialist.languages.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{specialist.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{specialist.consultation}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/30 pt-4">
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs text-muted-foreground">{specialist.reviews} reviews</span>
                  <Button size="sm" className="bg-brand hover:bg-brand/90">
                    Book Consultation
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
