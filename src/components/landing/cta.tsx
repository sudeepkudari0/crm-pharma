import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">Ready to Transform Your Sales Process?</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join thousands of pharmaceutical sales professionals who have already revolutionized their workflow with
              TrPharma CRM.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4 group">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-blue-600"
            >
              Schedule Demo
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-blue-100">
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              14-day free trial
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              No setup fees
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
