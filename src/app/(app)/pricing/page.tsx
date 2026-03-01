import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for getting started with RSS reading',
    features: [
      '6-hour refresh intervals',
      '5 AI credits per month',
      'Unlimited feeds',
      'Categories & folders',
      'Keyboard shortcuts',
      'Dark mode'
    ]
  },
  {
    name: 'Pro',
    price: '₹299',
    period: 'per month',
    popular: true,
    description: 'Ideal for professionals and power readers',
    features: [
      '1-hour refresh intervals',
      '150 AI credits per month',
      'AI topic clustering',
      'Full-text search',
      'OPML import & export',
      'Social media post generation',
      'Priority support'
    ]
  },
  {
    name: 'Power',
    price: '₹599',
    period: 'per month',
    description: 'For teams and heavy users',
    features: [
      '1-hour refresh intervals',
      '150 AI credits per month',
      'Up to 10 team members',
      'All Pro features',
      'AI daily digest',
      'API access',
      'Dedicated support'
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
    answer: 'You\'ll receive a warning when approaching your limit. Once reached, AI features are temporarily disabled until your next billing cycle.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.'
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-night-900">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sage-600 dark:text-sage-400 font-medium text-sm uppercase tracking-wider">Pricing</span>
          <h1 className="font-display text-4xl md:text-5xl text-ink-900 dark:text-white mt-3 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-ink-600 dark:text-ink-300 max-w-xl mx-auto">
            Start free and upgrade as you grow. All plans include core RSS reading features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`card p-8 relative ${plan.popular ? 'ring-2 ring-sage-500 scale-[1.02]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-sage-600 text-white px-4 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="font-display text-2xl text-ink-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-ink-500 dark:text-ink-400 text-sm mb-4">{plan.description}</p>
                <div>
                  <span className="text-4xl font-display text-ink-900 dark:text-white">{plan.price}</span>
                  <span className="text-ink-500 dark:text-ink-400 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
                    <span className="text-ink-700 dark:text-ink-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className={`btn w-full text-center ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.name === 'Free' ? 'Get Started Free' : `Start ${plan.name} Plan`}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mb-24">
          <h2 className="font-display text-3xl text-ink-900 dark:text-white text-center mb-12">
            Feature Comparison
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-parchment-300 dark:border-ink-700 bg-parchment-200/50 dark:bg-ink-800">
                  <th className="text-left py-4 px-6 font-semibold text-ink-800 dark:text-ink-100">Feature</th>
                  <th className="text-center py-4 px-6 font-semibold text-ink-800 dark:text-ink-100">Free</th>
                  <th className="text-center py-4 px-6 font-semibold text-sage-600 dark:text-sage-400">Pro</th>
                  <th className="text-center py-4 px-6 font-semibold text-ink-800 dark:text-ink-100">Power</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-300 dark:divide-ink-700">
                {[
                  { feature: 'Refresh Interval', free: '6 hours', pro: '1 hour', power: '1 hour' },
                  { feature: 'AI Credits', free: '5/mo', pro: '150/mo', power: '150/mo' },
                  { feature: 'Team Members', free: '1', pro: '1', power: '10' },
                  { feature: 'Topic Clustering', free: false, pro: true, power: true },
                  { feature: 'Social Media Posts', free: false, pro: true, power: true },
                  { feature: 'API Access', free: false, pro: false, power: true },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="py-4 px-6 text-ink-700 dark:text-ink-200">{row.feature}</td>
                    {(['free', 'pro', 'power'] as const).map((plan) => (
                      <td key={plan} className="py-4 px-6 text-center">
                        {typeof row[plan] === 'boolean' ? (
                          row[plan] ? (
                            <Check className="h-5 w-5 text-sage-600 mx-auto" />
                          ) : (
                            <span className="text-ink-300 dark:text-ink-600">—</span>
                          )
                        ) : (
                          <span className="text-ink-600 dark:text-ink-300">{row[plan]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-display text-3xl text-ink-900 dark:text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-display text-lg text-ink-800 dark:text-ink-50 mb-2">{faq.question}</h3>
                <p className="text-ink-600 dark:text-ink-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
