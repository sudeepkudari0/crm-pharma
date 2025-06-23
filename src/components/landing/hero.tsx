import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/hero.png')`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <div className="space-y-8 sm:space-y-10">
          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
            Pharma{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Sales
            </span>{" "}
            Portal
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-200 leading-relaxed max-w-3xl mx-auto font-light">
            A powerful CRM designed for Pharma. To help us Manage prospects,
            track activities, and close more deals with intelligent automation.
          </p>

          {/* Sign In Button */}
          <div className="pt-12">
            <Link href="/auth/signin">
              <Button
                size="lg"
                className="text-lg sm:text-xl px-4 py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 group border-0"
              >
                Sign In
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-20 w-16 h-16 bg-indigo-400/15 rounded-full blur-lg animate-pulse delay-500" />
    </section>
  );
}
