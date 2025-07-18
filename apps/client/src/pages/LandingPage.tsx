import { Link } from 'react-router-dom'
import { SignUpButton } from '@clerk/clerk-react'
import { Rss, Zap, Users, Smartphone, Brain, Share2 } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Rss,
      title: 'Smart RSS Aggregation',
      description: 'Automatically discover and organize content from your favorite sources with intelligent categorization.'
    },
    {
      icon: Brain,
      title: 'AI-Powered Summaries',
      description: 'Get instant article summaries and key insights powered by advanced AI to save time.'
    },
    {
      icon: Share2,
      title: 'Social Media Integration',
      description: 'Share articles directly to Twitter, LinkedIn, and Reddit with AI-generated posts.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share feeds and insights with your team members for better knowledge sharing.'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Get the latest content as it\'s published with customizable refresh intervals.'
    },
    {
      icon: Smartphone,
      title: 'Modern Interface',
      description: 'Beautiful, responsive design that works perfectly on all your devices.'
    }
  ]

  const pricing = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      features: [
        '6-hour refresh intervals',
        '5 AI credits per month',
        'Personal feeds only',
        'Basic analytics'
      ]
    },
    {
      name: 'Pro',
      price: '₹299',
      period: 'per month',
      popular: true,
      features: [
        '1-hour refresh intervals',
        '150 AI credits per month',
        'Up to 3 team members',
        'Slack integration',
        'Social media posting',
        'Advanced analytics'
      ]
    },
    {
      name: 'Power',
      price: '₹599',
      period: 'per month',
      features: [
        '1-hour refresh intervals',
        '150 AI credits per month',
        'Up to 10 team members',
        'All integrations',
        'Priority support',
        'Custom categories'
      ]
    }
  ]

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your AI-Powered
              <span className="text-primary-600 block">RSS Reader</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover, organize, and share content from across the web with intelligent 
              summaries, team collaboration, and seamless social media integration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal">
                <button className="btn btn-primary text-lg px-8 py-3">
                  Start Free Trial
                </button>
              </SignUpButton>
              <Link to="/pricing" className="btn btn-outline text-lg px-8 py-3">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to stay informed
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for modern content consumption
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-8 text-center">
                <feature.icon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that's right for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <div key={index} className={`card p-8 relative ${plan.popular ? 'ring-2 ring-primary-600' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <SignUpButton mode="modal">
                  <button className={`w-full ${plan.popular ? 'btn btn-primary' : 'btn btn-outline'}`}>
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your reading experience?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of users who stay informed with rivsy
          </p>
          <SignUpButton mode="modal">
            <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Start Your Free Trial
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  )
} 