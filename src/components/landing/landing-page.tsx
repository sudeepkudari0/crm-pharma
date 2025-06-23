import { Hero } from "./hero";
import { Features } from "./features";
// import { Benefits } from "./benefits"
// import { Testimonials } from "./testimonials"
// import { CTA } from "./cta"
import { Footer } from "./footer";
import { Navbar } from "./navbar";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      {/* <Benefits />
      <Testimonials />
      <CTA /> */}
      <Footer />
    </div>
  );
}
