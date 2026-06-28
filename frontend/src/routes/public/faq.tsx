import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { FAQ, FAQItem } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — AgriCare" },
      { name: "description", content: "Find answers to common questions about AgriCare's services, AI detection, marketplace, and more." },
      { property: "og:image", content: IMG.ricefield },
    ],
  }),
  component: FAQPage,
});

const GENERAL_FAQS: FAQItem[] = [
  { q: "Is AgriCare free for farmers?", a: "Core features like AI disease detection, basic weather forecasts, and government scheme matching are free for individual farmers. Premium services like one-on-one specialist consultations and bulk marketplace purchases are available at affordable rates." },
  { q: "What devices does AgriCare support?", a: "AgriCare works on all modern smartphones, tablets, and desktop computers. Our mobile app is available for both Android and iOS devices." },
  { q: "Which Indian languages do you support?", a: "We currently support Hindi, English, Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati, Punjabi, and Odia, with more languages being added regularly." },
  { q: "Do I need an internet connection to use AgriCare?", a: "While most features require an internet connection, our mobile app offers offline capabilities for basic AI disease detection." },
];

const AI_DETECTION_FAQS: FAQItem[] = [
  { q: "How accurate is the AI disease detection?", a: "Our models are trained on over 2 million field images across 40+ crops and achieve an average top-1 accuracy of 96.4% across India's diverse agro-climatic zones." },
  { q: "Which crops does the AI support?", a: "Our AI currently supports 40+ major crops including rice, wheat, cotton, sugarcane, vegetables, fruits, and pulses." },
  { q: "Do I need a special camera?", a: "No! You can use any standard smartphone camera. Just make sure the leaf is well-lit and fills most of the frame." },
  { q: "How long does it take to get results?", a: "Results are typically available in under 3 seconds on a good internet connection." },
];

const MARKETPLACE_FAQS: FAQItem[] = [
  { q: "Are the merchants verified?", a: "Yes! All merchants on AgriCare Marketplace go through a strict verification process including KYC and business registration checks." },
  { q: "Do you deliver to my village?", a: "We ship across 28 states and union territories through our extensive logistics partner network. Enter your pincode at checkout to confirm availability." },
  { q: "What is your return policy?", a: "We offer a 7-day replacement guarantee for defective or incorrect products. Please check the product page for specific return policies." },
  { q: "What payment methods are available?", a: "We accept UPI, debit/credit cards, net banking, and mobile wallets." },
];

const CONSULTATION_FAQS: FAQItem[] = [
  { q: "What types of consultations are available?", a: "We offer video, voice, and chat consultations depending on the specialist's availability and your preference." },
  { q: "How do I book a consultation?", a: "Simply browse specialists on this page, select your preferred expert, and book a time slot that works for you." },
  { q: "Can I choose my specialist?", a: "Absolutely! You can filter specialists by expertise, language, location, and ratings to find the perfect match." },
  { q: "What if I'm not satisfied with the consultation?", a: "We offer a satisfaction guarantee. If you're not happy with your consultation, please contact our support team within 24 hours." },
];

function FAQPage() {
  return (
    <>
      <PageHero
        eyebrow="Frequently Asked Questions"
        title="Everything you need to know."
        description="Find answers to common questions about AgriCare's services, AI detection, marketplace, and more."
        image={IMG.ricefield}
        imageAlt="FAQ hero image"
      />

      <Section>
        <SectionHeader eyebrow="General" title="About AgriCare" />
        <FAQ items={GENERAL_FAQS} />
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="AI Detection" title="Crop Disease Detection" />
        <FAQ items={AI_DETECTION_FAQS} />
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Marketplace" title="Buying & Selling" />
        <FAQ items={MARKETPLACE_FAQS} />
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Consultation" title="Expert Advice" />
        <FAQ items={CONSULTATION_FAQS} />
      </Section>

      <CTA />
    </>
  );
}
