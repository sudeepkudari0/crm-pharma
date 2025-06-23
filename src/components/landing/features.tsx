import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, BarChart3, MessageSquare, Calendar, Target, Shield, Smartphone, Zap } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Prospect Management",
    description: "Comprehensive contact management with detailed profiles, interaction history, and lead scoring.",
  },
  {
    icon: Activity,
    title: "Activity Tracking",
    description: "Log calls, meetings, emails, and visits with automated follow-up reminders and outcomes.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Real-time dashboards with sales metrics, conversion rates, and performance insights.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integration",
    description: "Seamlessly communicate with prospects through integrated WhatsApp messaging.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Intelligent calendar management with automated appointment scheduling and reminders.",
  },
  {
    icon: Target,
    title: "Territory Management",
    description: "Organize prospects by territory with route optimization and coverage analysis.",
  },
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description: "Enterprise-grade security ensuring all patient and medical data remains protected.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Native mobile apps for iOS and Android with offline capability for field representatives.",
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Workflow automation for repetitive tasks, email sequences, and follow-up processes.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Everything You Need to <span className="text-blue-600">Accelerate Sales</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built specifically for pharmaceutical sales teams with industry-specific features and compliance
            requirements.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
