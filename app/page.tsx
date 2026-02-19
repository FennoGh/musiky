import Hero from "../components/homepage/Hero";
import Problem from "../components/homepage/Problem";
import ImageDivider from "../components/homepage/ImageDivider";
import Collaboration from "../components/homepage/Collaboration";
import HowItWorks from "../components/homepage/HowItWorks";
import Features from "../components/homepage/Features";
import Testimonials from "../components/homepage/Testimonials";
import Pricing from "../components/homepage/Pricing";
import FAQ from "../components/homepage/FAQ";
import CTA from "../components/homepage/CTA";

export default function Home() {
  return (
    <main>
      <Hero />
      <Problem />
      <ImageDivider />
      <Collaboration />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
    </main>
  );
}
