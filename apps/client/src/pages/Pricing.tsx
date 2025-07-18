import { SignUpButton } from '@clerk/clerk-react'
import { Check } from 'lucide-react'

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for getting started with RSS reading',
      features: [
        '6-hour refresh intervals',
        '5 AI credits per month',
        'Personal feeds only',
        'Basic analytics',
        'Email support'
      ]
    },
    {
      name: 'Pro',
      price: '₹299',
      period: 'per month',
      popular: true,
      description: 'Ideal for professionals and small teams',
      features: [
        '1-hour refresh intervals',
        '150 AI credits per month',
        'Up to 3 team members',
        'Slack integration',
        'Social media posting (Twitter, LinkedIn, Reddit)',
        'Advanced analytics',
        'Priority support'
      ]
    },
    {
      name: 'Power',
      price: '₹599',
      period: 'per month',
      description: 'For larger teams and power users',
      features: [
        '1-hour refresh intervals',
        '150 AI credits per month',
        'Up to 10 team members',
        'All integrations',
        'Custom categories',
        'Advanced analytics',
        'Dedicated support',
        'API access'
      ]
    }
  ]

  const faqs = [
    {
      question: 'What are AI credits?',
      answer: 'AI credits are used for article summarization, keyword extraction, sentiment analysis, and social media post generation. Each action costs 1 credit.'
    },
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.'
    },
    {
      question: 'What happens if I exceed my AI credits?',
      answer: 'You\'ll receive a warning at 150 credits. At 180 credits, AI features are temporarily disabled until your next billing cycle.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.'
    },
    {
      question: 'Can I use my own RSS feeds?',
      answer: 'Absolutely! You can add any RSS or Atom feed URL. We also support non-RSS websites with content extraction.'
    }
  ]

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free and upgrade as you grow. All plans include our core RSS reading features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {plans.map((plan, index) => (
            <div key={index} className={`card p-8 relative ${plan.popular ? 'ring-2 ring-primary-600 scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <SignUpButton mode="modal">
                <button className={`w-full ${plan.popular ? 'btn btn-primary' : 'btn btn-outline'}`}>
                  {plan.name === 'Free' ? 'Get Started Free' : `Start ${plan.name} Plan`}
                </button>
              </SignUpButton>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Free</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Pro</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Power</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-6 text-gray-700">Refresh Interval</td>
                  <td className="py-4 px-6 text-center text-gray-600">6 hours</td>
                  <td className="py-4 px-6 text-center text-gray-600">1 hour</td>
                  <td className="py-4 px-6 text-center text-gray-600">1 hour</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">AI Credits</td>
                  <td className="py-4 px-6 text-center text-gray-600">5/month</td>
                  <td className="py-4 px-6 text-center text-gray-600">150/month</td>
                  <td className="py-4 px-6 text-center text-gray-600">150/month</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Team Members</td>
                  <td className="py-4 px-6 text-center text-gray-600">1</td>
                  <td className="py-4 px-6 text-center text-gray-600">3</td>
                  <td className="py-4 px-6 text-center text-gray-600">10</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Slack Integration</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-green-500">✓</td>
                  <td className="py-4 px-6 text-center text-green-500">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Social Media Posting</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-green-500">✓</td>
                  <td className="py-4 px-6 text-center text-green-500">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">API Access</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-green-500">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 