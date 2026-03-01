'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Rss, Sparkles, Layers, Zap, BookOpen, ArrowRight, Check,
  MousePointer2, Newspaper, Bell, Search, Shield, Smartphone,
  Moon, Globe, Clock, Star, FileText, Filter, Tag, Share2,
  Download, RefreshCw, Bookmark, Brain, Languages, BarChart3
} from 'lucide-react'
import Footer from '@/components/layout/footer'

const previewData = {
  all: {
    count: 24,
    articles: [
      { title: 'The Future of Web Development in 2025', source: 'Smashing Magazine', time: '2h ago', saved: false },
      { title: 'How AI is Transforming Content Creation', source: 'TechCrunch', time: '4h ago', saved: false },
      { title: 'Design Systems: A Complete Guide', source: 'Design Weekly', time: '6h ago', saved: false }
    ]
  },
  technology: {
    count: 8,
    articles: [
      { title: 'React 19: What You Need to Know', source: 'React Blog', time: '1h ago', saved: false },
      { title: 'The Rise of Edge Computing', source: 'Vercel Blog', time: '3h ago', saved: false },
      { title: 'TypeScript 5.4 Release Notes', source: 'Microsoft Dev', time: '5h ago', saved: false }
    ]
  },
  design: {
    count: 6,
    articles: [
      { title: 'Typography Best Practices for Web', source: 'Design Weekly', time: '2h ago', saved: false },
      { title: 'Color Theory in Modern UI Design', source: 'Figma Blog', time: '4h ago', saved: false },
      { title: 'Accessibility-First Design Systems', source: 'A11y Project', time: '8h ago', saved: false }
    ]
  },
  saved: {
    count: 3,
    articles: [
      { title: 'The Complete Guide to CSS Grid', source: 'CSS Tricks', time: '2d ago', saved: true },
      { title: 'Building Scalable APIs with Node.js', source: 'Node Weekly', time: '3d ago', saved: true },
      { title: 'UX Writing: The Ultimate Guide', source: 'UX Collective', time: '1w ago', saved: true }
    ]
  }
}

type PreviewCategory = keyof typeof previewData

export default function LandingPage() {
  const { status } = useSession()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<PreviewCategory>('all')

  if (status === 'authenticated') {
    router.replace('/dashboard')
    return null
  }

  if (status === 'loading') return null

  const coreFeatures = [
    {
      icon: Rss,
      title: 'Universal feed support',
      description: 'Subscribe to RSS, Atom, and JSON feeds from any website. Blogs, news outlets, podcasts, YouTube channels—all in one place.'
    },
    {
      icon: Sparkles,
      title: 'AI-powered summaries',
      description: 'Get instant article summaries powered by AI. Understand key points in seconds without reading the full article.'
    },
    {
      icon: Layers,
      title: 'Smart organization',
      description: 'Create custom categories and folders. Organize feeds by topic, priority, or however works for you.'
    },
    {
      icon: Zap,
      title: 'Real-time sync',
      description: 'Feeds update automatically in the background. New articles appear instantly—no manual refresh needed.'
    },
    {
      icon: BookOpen,
      title: 'Distraction-free reading',
      description: 'Clean article view strips away clutter. Just you and the content, the way reading should be.'
    },
    {
      icon: MousePointer2,
      title: 'Keyboard-first design',
      description: 'Navigate with j/k keys, mark as read with m, save with s. Power through your reading list efficiently.'
    }
  ]

  const aiFeatures = [
    {
      icon: Brain,
      title: 'Smart summaries',
      description: 'AI reads articles for you and extracts key takeaways. See past clickbait in seconds.'
    },
    {
      icon: Tag,
      title: 'Auto-categorization',
      description: 'Articles are automatically tagged and categorized. Never manually sort content again.'
    },
    {
      icon: BarChart3,
      title: 'Topic clustering',
      description: 'Related articles grouped into story threads. See the full picture across multiple sources.'
    },
    {
      icon: Languages,
      title: 'Translation',
      description: 'Read articles in any language with AI-powered translation. The world is your feed.'
    }
  ]

  const additionalFeatures = [
    { icon: Search, title: 'Full-text search', description: 'Search across all your saved articles and feeds' },
    { icon: Bell, title: 'Smart notifications', description: 'Get alerts for keywords or specific feeds' },
    { icon: Moon, title: 'Dark mode', description: 'Easy on the eyes, day or night' },
    { icon: Filter, title: 'Advanced filters', description: 'Filter by read status, date, or source' },
    { icon: Tag, title: 'Tagging system', description: 'Add custom tags to organize articles' },
    { icon: Bookmark, title: 'Save for later', description: 'Bookmark articles to read when you have time' },
    { icon: Share2, title: 'Easy sharing', description: 'Share articles via link or social media' },
    { icon: Download, title: 'Export options', description: 'Export your feeds and articles anytime' },
    { icon: Globe, title: 'Cross-platform', description: 'Access from any browser, any device' },
    { icon: Shield, title: 'Privacy-focused', description: 'Your reading habits stay private' },
    { icon: Smartphone, title: 'Mobile-friendly', description: 'Responsive design works everywhere' },
    { icon: RefreshCw, title: 'Auto-sync', description: 'Background updates keep you current' }
  ]

  const useCases = [
    {
      title: 'For news enthusiasts',
      description: 'Follow dozens of news sources without visiting each site. Get a personalized morning briefing with AI summaries.',
      icon: Newspaper
    },
    {
      title: 'For developers',
      description: 'Stay updated on tech blogs, release notes, and industry news. Never miss important updates from your favorite frameworks.',
      icon: FileText
    },
    {
      title: 'For researchers',
      description: 'Track academic journals, industry publications, and thought leaders. Save and organize articles for later reference.',
      icon: Search
    },
    {
      title: 'For content creators',
      description: 'Monitor competitors, find inspiration, and stay on top of trends in your niche. All your research in one place.',
      icon: Star
    }
  ]

  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-night-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-parchment-100/80 dark:bg-night-900/80 backdrop-blur-lg border-b border-parchment-300 dark:border-ink-700">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sage-600 flex items-center justify-center">
              <Rss className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl text-ink-800 dark:text-ink-50">Syncd</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/sign-up" className="btn btn-primary btn-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-sage-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-parchment-300 dark:border-ink-700 bg-white dark:bg-night-800 text-sm text-ink-700 dark:text-ink-200 mb-8 animate-fade-in">
              <Newspaper className="h-4 w-4 text-sage-600" />
              <span>A modern RSS reader with AI superpowers</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-ink-900 dark:text-white mb-6 animate-fade-in">
              Your reading,
              <br />
              <span className="text-sage-600 dark:text-sage-400">simplified.</span>
            </h1>

            <p className="text-lg md:text-xl text-ink-600 dark:text-ink-300 max-w-2xl mx-auto mb-10 animate-fade-in">
              Subscribe to RSS feeds from any website, organize by topic, and let AI summarize articles for you.
              Stay informed without the information overload.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Link href="/sign-up" className="btn btn-primary btn-lg group">
                Start reading for free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#features" className="btn btn-secondary btn-lg">
                See all features
              </a>
            </div>

            <p className="mt-10 text-sm text-ink-500 dark:text-ink-400 animate-fade-in">
              Free forever with 5 AI summaries/month. No credit card required.
            </p>
          </div>

          {/* App Preview - Interactive */}
          <div className="mt-16 md:mt-24 animate-fade-in">
            <div className="relative mx-auto max-w-4xl">
              <div className="bg-white dark:bg-night-800 rounded-2xl border border-parchment-300 dark:border-ink-700 shadow-elevated overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-parchment-300 dark:border-ink-700 bg-parchment-100 dark:bg-night-900">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="max-w-md mx-auto px-4 py-1.5 bg-white dark:bg-ink-800 rounded-lg text-xs text-ink-500 dark:text-ink-400 text-center border border-parchment-300 dark:border-ink-700">
                      syncd.app/dashboard
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8 bg-parchment-50 dark:bg-night-950">
                  <div className="flex gap-6">
                    <div className="hidden md:block w-52 space-y-1">
                      {(['all', 'technology', 'design', 'saved'] as PreviewCategory[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`w-full px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all duration-200 ${
                            selectedCategory === cat
                              ? 'bg-sage-50 dark:bg-sage-500/10 text-sage-700 dark:text-sage-400 font-medium'
                              : 'text-ink-600 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-ink-800'
                          }`}
                        >
                          {cat === 'all' && <Rss className="h-4 w-4" />}
                          {cat === 'technology' && <Layers className="h-4 w-4" />}
                          {cat === 'design' && <Layers className="h-4 w-4" />}
                          {cat === 'saved' && <Bookmark className={`h-4 w-4 ${selectedCategory === 'saved' ? 'fill-current' : ''}`} />}
                          <span className="capitalize">{cat === 'all' ? 'All Articles' : cat}</span>
                          {selectedCategory === cat && (
                            <span className="ml-auto bg-sage-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {previewData[cat].count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 space-y-4">
                      {previewData[selectedCategory].articles.map((article, i) => (
                        <div
                          key={`${selectedCategory}-${i}`}
                          className="p-4 rounded-xl border border-parchment-300 dark:border-ink-700 bg-white dark:bg-night-800 hover:shadow-md transition-all duration-300 animate-fade-in"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${article.saved ? 'bg-coral-500' : 'bg-sage-500'}`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-ink-800 dark:text-white mb-1">{article.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                                <span>{article.source}</span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {article.time}
                                </span>
                                {article.saved && (
                                  <>
                                    <span>·</span>
                                    <span className="flex items-center gap-1 text-coral-500">
                                      <Bookmark className="h-3 w-3 fill-current" />
                                      Saved
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button className="p-1.5 rounded-lg hover:bg-parchment-200 dark:hover:bg-ink-700 text-ink-400 transition-colors">
                              <Sparkles className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center mt-4 text-sm text-ink-500 dark:text-ink-400">
                Click the categories to see it in action
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-24 md:py-32 border-t border-parchment-300 dark:border-ink-700">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sage-600 dark:text-sage-400 font-medium text-sm uppercase tracking-wider">Features</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Everything you need to read smarter
            </h2>
            <p className="text-lg text-ink-600 dark:text-ink-300 max-w-xl mx-auto">
              A focused set of powerful features designed to help you consume content more efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-white dark:bg-night-800 border border-parchment-300 dark:border-ink-700 hover:border-sage-300 dark:hover:border-sage-800 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-sage-50 dark:bg-sage-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-sage-600 dark:text-sage-400" />
                </div>
                <h3 className="font-display text-lg text-ink-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-ink-600 dark:text-ink-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="py-24 md:py-32 bg-ink-900 dark:bg-night-800 text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-coral-400 font-medium text-sm uppercase tracking-wider">AI-Powered</span>
            <h2 className="font-display text-3xl md:text-4xl mt-3 mb-4">
              Read more in less time
            </h2>
            <p className="text-lg text-ink-300 max-w-xl mx-auto">
              AI that quietly helps you stay on top of everything — no gimmicks, just utility.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {aiFeatures.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-coral-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-coral-400" />
                </div>
                <h3 className="font-display text-lg mb-2">{feature.title}</h3>
                <p className="text-ink-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-lg mx-auto">
            <div className="bg-ink-800 dark:bg-night-900 rounded-2xl p-6 border border-ink-700">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-coral-400" />
                <span className="font-medium">AI Summary</span>
              </div>
              <div className="space-y-3 text-ink-300 text-sm leading-relaxed">
                <p><strong className="text-white">Key points:</strong></p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>New framework reduces bundle size by 40%</li>
                  <li>Backwards compatible with existing code</li>
                  <li>Performance improvements in rendering</li>
                  <li>Available now in beta for testing</li>
                </ul>
                <p className="pt-2 text-ink-500 text-xs">Summary generated in 1.2 seconds</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 md:py-32 border-t border-parchment-300 dark:border-ink-700">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sage-600 dark:text-sage-400 font-medium text-sm uppercase tracking-wider">Use Cases</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Built for how you read
            </h2>
            <p className="text-lg text-ink-600 dark:text-ink-300 max-w-xl mx-auto">
              Whether you&apos;re a casual reader or a power user, Syncd adapts to your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="p-8 rounded-2xl bg-white dark:bg-night-800 border border-parchment-300 dark:border-ink-700">
                <div className="w-12 h-12 rounded-xl bg-sage-50 dark:bg-sage-900/30 flex items-center justify-center mb-5">
                  <useCase.icon className="h-6 w-6 text-sage-600 dark:text-sage-400" />
                </div>
                <h3 className="font-display text-xl text-ink-900 dark:text-white mb-3">{useCase.title}</h3>
                <p className="text-ink-600 dark:text-ink-400 leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Features Grid */}
      <section className="py-24 md:py-32 bg-parchment-200/50 dark:bg-night-800/50 border-y border-parchment-300 dark:border-ink-700">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sage-600 dark:text-sage-400 font-medium text-sm uppercase tracking-wider">And more</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Packed with features
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="p-4 rounded-xl bg-white dark:bg-night-800 border border-parchment-300 dark:border-ink-700 text-center">
                <feature.icon className="h-5 w-5 text-sage-600 dark:text-sage-400 mx-auto mb-2" />
                <h4 className="font-medium text-ink-800 dark:text-white text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-ink-500 dark:text-ink-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sage-600 dark:text-sage-400 font-medium text-sm uppercase tracking-wider">Getting Started</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Up and running in 60 seconds
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: '1', title: 'Add your feeds', desc: 'Paste any website URL or RSS feed. We auto-detect feeds and import them instantly.' },
              { step: '2', title: 'Organize your way', desc: 'Create categories to group your feeds. Tech, news, hobbies—organize however makes sense to you.' },
              { step: '3', title: 'Read smarter', desc: 'Browse your personalized feed. Use AI to summarize long articles. Save favorites for later.' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-sage-600 text-white font-display text-2xl flex items-center justify-center mx-auto mb-5 shadow-glow-sage">
                  {item.step}
                </div>
                <h3 className="font-display text-xl text-ink-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-ink-600 dark:text-ink-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 md:py-32 bg-parchment-200/50 dark:bg-night-800/50 border-y border-parchment-300 dark:border-ink-700" id="pricing">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sage-600 dark:text-sage-400 font-medium text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-ink-600 dark:text-ink-300">
              Start free, upgrade when you need more AI power.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl bg-white dark:bg-night-800 border border-parchment-300 dark:border-ink-700">
              <h3 className="font-display text-2xl text-ink-900 dark:text-white mb-2">Free</h3>
              <p className="text-ink-500 dark:text-ink-400 text-sm mb-4">Perfect for getting started</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-display text-ink-900 dark:text-white">$0</span>
                <span className="text-ink-500 dark:text-ink-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited RSS feeds', '5 AI summaries per month', 'All categories & folders', 'Keyboard shortcuts', 'Dark mode', 'Mobile-friendly'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-ink-700 dark:text-ink-200">
                    <Check className="h-5 w-5 text-sage-600 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="btn btn-secondary w-full text-center">Get started free</Link>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-night-800 border-2 border-sage-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-sage-600 text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>
              </div>
              <h3 className="font-display text-2xl text-ink-900 dark:text-white mb-2">Pro</h3>
              <p className="text-ink-500 dark:text-ink-400 text-sm mb-4">For power readers</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-display text-ink-900 dark:text-white">$9</span>
                <span className="text-ink-500 dark:text-ink-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Free', '150 AI summaries per month', 'AI topic clustering', 'Full-text search', 'OPML export', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-ink-700 dark:text-ink-200">
                    <Check className="h-5 w-5 text-sage-600 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="btn btn-primary w-full text-center">Start 14-day free trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 bg-ink-900 dark:bg-night-800 border-t border-ink-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white mb-6">
            Ready to simplify your reading?
          </h2>
          <p className="text-lg text-ink-300 mb-10 max-w-xl mx-auto">
            Join readers who use Syncd to stay informed without the noise.
            Set up in 60 seconds, free forever.
          </p>
          <Link href="/sign-up" className="inline-flex items-center bg-coral-500 hover:bg-coral-600 text-white px-8 py-4 rounded-2xl font-medium text-lg transition-all hover:shadow-glow-coral hover:-translate-y-0.5">
            Create free account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="mt-6 text-sm text-ink-500">
            No credit card required · Free plan available forever
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
