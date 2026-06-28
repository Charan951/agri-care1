import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — AgriSphere" },
      { name: "description", content: "The terms that govern your use of AgriSphere." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & Conditions"
        description="By using AgriSphere you agree to these terms. Last updated June 28, 2026."
        compact
      />
      <Section>
        <div className="prose-content mx-auto max-w-3xl space-y-6 text-[15px] leading-relaxed text-foreground">
          <h2 className="text-2xl font-bold tracking-tight">1. Acceptance</h2>
          <p>By creating an account or using any AgriSphere service, you agree to these terms.</p>
          <h2 className="text-2xl font-bold tracking-tight">2. Eligibility</h2>
          <p>You must be 18 or older and capable of entering into a binding contract under Indian law.</p>
          <h2 className="text-2xl font-bold tracking-tight">3. Accounts</h2>
          <p>You're responsible for activity under your account. Keep your password secure.</p>
          <h2 className="text-2xl font-bold tracking-tight">4. Marketplace</h2>
          <p>Listings are provided by third-party merchants. AgriSphere verifies merchants and price-matches but is not the seller of record unless explicitly stated.</p>
          <h2 className="text-2xl font-bold tracking-tight">5. AI advisory</h2>
          <p>AI outputs are decision support, not a guarantee. Use professional agronomic judgment for high-value decisions.</p>
          <h2 className="text-2xl font-bold tracking-tight">6. Payments & refunds</h2>
          <p>Refunds follow our 7-day return policy on eligible categories. See product pages for category-specific terms.</p>
          <h2 className="text-2xl font-bold tracking-tight">7. Limitation of liability</h2>
          <p>To the maximum extent permitted by law, AgriSphere's liability is limited to the amount you paid for the relevant service in the prior 12 months.</p>
          <h2 className="text-2xl font-bold tracking-tight">8. Governing law</h2>
          <p>These terms are governed by the laws of India, with exclusive jurisdiction in Bengaluru.</p>
        </div>
      </Section>
    </>
  );
}
