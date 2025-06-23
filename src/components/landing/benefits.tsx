import { CheckCircle } from "lucide-react"

const benefits = [
  {
    title: "Increase Sales by 40%",
    description: "Our customers see an average 40% increase in sales within the first 6 months.",
  },
  {
    title: "Save 10+ Hours Weekly",
    description: "Automate repetitive tasks and focus on what matters most - building relationships.",
  },
  {
    title: "Improve Compliance",
    description: "Built-in compliance features ensure you meet all pharmaceutical industry regulations.",
  },
  {
    title: "Better Customer Relationships",
    description: "Detailed interaction history helps you provide personalized service to every prospect.",
  },
  {
    title: "Real-time Insights",
    description: "Make data-driven decisions with comprehensive analytics and reporting.",
  },
  {
    title: "Seamless Integration",
    description: "Integrates with your existing tools and workflows without disruption.",
  },
]

export function Benefits() {
  return (
    <section id="benefits" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Why Pharmaceutical Companies Choose <span className="text-blue-600">TrPharma</span>
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands of pharmaceutical sales representatives who have transformed their sales process with our
                industry-leading CRM platform.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-2xl p-8 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Companies Trust Us</div>
            </div>
            <div className="bg-green-50 rounded-2xl p-8 text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="bg-purple-50 rounded-2xl p-8 text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-8 text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
