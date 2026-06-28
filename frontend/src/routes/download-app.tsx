import { createFileRoute } from "@tanstack/react-router";
import { Smartphone, Play, Apple, QrCode, ScanLine, Store, CloudSun, HeartHandshake } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/download-app")({
  head: () => ({
    meta: [
      { title: "Download AgriCare App — Get Started" },
      { name: "description", content: "Download the AgriCare mobile app for Android and iOS to access all features on-the-go." },
      { property: "og:image", content: IMG.farmerPhone },
    ],
  }),
  component: DownloadApp,
});

const APP_FEATURES = [
  { icon: ScanLine, title: "Instant AI Detection", description: "Diagnose crop diseases instantly with your camera, even offline." },
  { icon: Store, title: "Marketplace Access", description: "Buy quality seeds, fertilizers, and tools on-the-go." },
  { icon: CloudSun, title: "Weather Alerts", description: "Get real-time weather forecasts and alerts for your farm." },
  { icon: HeartHandshake, title: "Expert Consultation", description: "Book and join consultations directly from your phone." },
];

function DownloadApp() {
  return (
    <>
      <PageHero
        eyebrow="Download App"
        title="AgriCare in your pocket."
        description="Download our mobile app to access all features anytime, anywhere. Works offline too."
        image={IMG.farmerPhone}
        imageAlt="Farmer using AgriCare app"
      />

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow="Features" title="Everything you need, in one app." description="Designed specifically for farmers, our app is fast, reliable, and works even on 2G/3G networks." />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {APP_FEATURES.map((f) => (
                <Card key={f.title}>
                  <CardContent className="p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                      <f.icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="bg-black hover:bg-gray-800">
                <Play className="mr-2 h-5 w-5" />
                Google Play
              </Button>
              <Button size="lg" className="bg-black hover:bg-gray-800">
                <Apple className="mr-2 h-5 w-5" />
                App Store
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex h-[500px] w-[280px] items-center justify-center rounded-[2.5rem] border-4 border-foreground bg-background p-3">
                <div className="h-full w-full overflow-hidden rounded-[2rem] border border-border bg-muted/50">
                  <img src={IMG.farmerPhone} alt="App screenshot" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="absolute -right-12 bottom-10">
                <Card className="w-40">
                  <CardContent className="p-4 flex flex-col items-center">
                    <QrCode className="h-24 w-24" />
                    <p className="mt-2 text-xs font-semibold">Scan to download</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <CTA />
    </>
  );
}
