import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — AgriSphere" },
      { name: "description", content: "How AgriSphere collects, uses, and protects your data." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="This policy is maintained by AgriSphere to explain how we handle personal information. Last updated June 28, 2026."
        compact
      />
      <Section>
        <div className="prose-content mx-auto max-w-3xl space-y-6 text-[15px] leading-relaxed text-foreground">
          <p>This page summarizes AgriSphere's privacy practices for the website and mobile apps operated by AgriSphere Technologies Pvt. Ltd. It is informational and not a substitute for legal advice.</p>
          <h2 className="text-2xl font-bold tracking-tight">1. Information we collect</h2>
          <p>Account details (name, mobile, email), farm profile (land size, crops, location), uploaded photos for AI scans, transaction history, and device/usage metadata.</p>
          <h2 className="text-2xl font-bold tracking-tight">2. How we use information</h2>
          <p>To provide advisory, run AI models, fulfill marketplace orders, send notifications you opt into, and improve the platform.</p>
          <h2 className="text-2xl font-bold tracking-tight">3. Sharing</h2>
          <p>We do not sell your data. We share strictly as required with verified merchants for order fulfillment, payment processors, and government bodies when legally compelled.</p>
          <h2 className="text-2xl font-bold tracking-tight">4. Security</h2>
          <p>Data is encrypted at rest (AES-256) and in transit (TLS 1.3). Access is role-based and audited.</p>
          <h2 className="text-2xl font-bold tracking-tight">5. Your rights</h2>
          <p>You can access, correct, export, or delete your data anytime from Settings, or by writing to privacy@agrisphere.in.</p>
          <h2 className="text-2xl font-bold tracking-tight">6. Cookies</h2>
          <p>We use essential cookies for sign-in and analytics cookies to understand usage. You can adjust preferences in your browser.</p>
          <h2 className="text-2xl font-bold tracking-tight">7. Contact</h2>
          <p>Questions? Email privacy@agrisphere.in or write to our Bengaluru office.</p>
        </div>
      </Section>
    </>
  );
}
