import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Dr. Michael Chen",
    role: "Sales Director",
    company: "PharmaCorp International",
    content:
      "TrPharma has revolutionized how our sales team operates. The pharmaceutical-specific features and compliance tools have increased our efficiency by 60%.",
    rating: 5,
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Sarah Johnson",
    role: "Regional Sales Manager",
    company: "MedTech Solutions",
    content:
      "The WhatsApp integration and mobile app have been game-changers for our field representatives. We can now stay connected with prospects anywhere.",
    rating: 5,
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "David Rodriguez",
    role: "VP of Sales",
    company: "BioPharm Dynamics",
    content:
      "The analytics and reporting features provide insights we never had before. We've improved our conversion rates by 45% since implementing TrPharma.",
    rating: 5,
    avatar: "/placeholder.svg?height=60&width=60",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Trusted by Industry Leaders</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See what pharmaceutical companies are saying about TrPharma CRM.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center space-x-4">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-blue-600">{testimonial.company}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
