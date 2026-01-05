import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignUpButton, useAuth } from '@clerk/clerk-react'
import {
  Rss,
  Sparkles,
  Layers,
  Zap,
  BookOpen,
  ArrowRight,
  Check,
  MousePointer2,
  Newspaper,
  Bell,
  Search,
  Shield,
  Smartphone,
  Moon,
  Globe,
  Clock,
  Star,
  Heart,
  FileText,
  Filter,
  Tag,
  Share2,
  Download,
  RefreshCw,
  Bookmark
} from 'lucide-react'
import Footer from '../components/Footer'

// Mock data for interactive preview
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
  business: {
    count: 5,
    articles: [
      { title: 'Startup Funding Trends in 2025', source: 'TechCrunch', time: '1h ago', saved: false },
      { title: 'Remote Work: The New Normal', source: 'Fast Company', time: '3h ago', saved: false },
      { title: 'AI Tools Reshaping Productivity', source: 'MIT Tech Review', time: '6h ago', saved: false }
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
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<PreviewCategory>('all')

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoaded, isSignedIn, navigate])

  // Show nothing while checking auth to prevent flash
  if (!isLoaded) {
    return null
  }

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

  const additionalFeatures = [
    { icon: Search, title: 'Full-text search', description: 'Search across all your saved articles and feeds' },
    { icon: Bell, title: 'Smart notifications', description: 'Get alerts for keywords or specific feeds' },
    { icon: Moon, title: 'Dark mode', description: 'Easy on the eyes, day or night' },
    { icon: Filter, title: 'Advanced filters', description: 'Filter by read status, date, or source' },
    { icon: Tag, title: 'Tagging system', description: 'Add custom tags to organize articles' },
    { icon: Heart, title: 'Save for later', description: 'Bookmark articles to read when you have time' },
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

  const comparisonPoints = [
    { feature: 'Unlimited feeds', rivsy: true, others: 'Limited on free plans' },
    { feature: 'AI summaries', rivsy: true, others: 'Premium only or no AI' },
    { feature: 'Keyboard shortcuts', rivsy: true, others: 'Basic or none' },
    { feature: 'Modern interface', rivsy: true, others: 'Often dated UI' },
    { feature: 'Privacy-focused', rivsy: true, others: 'Tracking common' },
    { feature: 'Fast performance', rivsy: true, others: 'Can be sluggish' }
  ]

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-midnight-950">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }}
        />

        {/* Gradient orb - subtle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-coral-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-ink-700 dark:text-neutral-200 mb-8 opacity-0 animate-fade-up">
              <Newspaper className="h-4 w-4 text-coral-500" />
              <span>A modern RSS reader with AI superpowers</span>
            </div>

            {/* Headline - HIGH CONTRAST */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-ink-900 dark:text-white mb-6 opacity-0 animate-fade-up delay-100">
              Your reading,
              <br />
              <span className="text-gradient">simplified.</span>
            </h1>

            {/* Subheadline - readable contrast */}
            <p className="text-lg md:text-xl text-ink-700 dark:text-neutral-200 max-w-2xl mx-auto mb-10 opacity-0 animate-fade-up delay-200">
              Subscribe to RSS feeds from any website, organize by topic, and let AI summarize articles for you.
              Stay informed without the information overload.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-up delay-300">
              <SignUpButton mode="modal">
                <button className="btn btn-primary btn-lg group">
                  Start reading for free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </SignUpButton>
              <a href="#features" className="btn btn-secondary btn-lg">
                See all features
              </a>
            </div>

            {/* Simple value prop */}
            <p className="mt-10 text-sm text-ink-600 dark:text-neutral-300 opacity-0 animate-fade-up delay-400">
              Free forever with 5 AI summaries/month. No credit card required.
            </p>
          </div>

          {/* App Preview - Interactive */}
          <div className="mt-16 md:mt-24 opacity-0 animate-fade-up delay-500">
            <div className="relative mx-auto max-w-4xl">
              {/* Browser chrome */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-elevated overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="max-w-md mx-auto px-4 py-1.5 bg-white dark:bg-neutral-800 rounded-lg text-xs text-ink-600 dark:text-neutral-300 text-center border border-neutral-200 dark:border-neutral-700">
                      rivsy.app/dashboard
                    </div>
                  </div>
                </div>

                {/* Mock content */}
                <div className="p-6 md:p-8 bg-paper-50 dark:bg-midnight-950">
                  <div className="flex gap-6">
                    {/* Sidebar mock - Interactive */}
                    <div className="hidden md:block w-52 space-y-1">
                      {/* All Articles */}
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                          selectedCategory === 'all'
                            ? 'bg-coral-50 dark:bg-coral-500/10 text-coral-600 dark:text-coral-400'
                            : 'text-ink-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Rss className="h-4 w-4" />
                        All Articles
                        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
                          selectedCategory === 'all'
                            ? 'bg-coral-500 text-white'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-ink-600 dark:text-neutral-300'
                        }`}>
                          {previewData.all.count}
                        </span>
                      </button>

                      {/* Technology */}
                      <button
                        onClick={() => setSelectedCategory('technology')}
                        className={`w-full px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all duration-200 ${
                          selectedCategory === 'technology'
                            ? 'bg-coral-50 dark:bg-coral-500/10 text-coral-600 dark:text-coral-400 font-medium'
                            : 'text-ink-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Layers className={`h-4 w-4 ${selectedCategory === 'technology' ? 'text-coral-500' : 'text-ink-400'}`} />
                        Technology
                        {selectedCategory === 'technology' && (
                          <span className="ml-auto bg-coral-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {previewData.technology.count}
                          </span>
                        )}
                      </button>

                      {/* Design */}
                      <button
                        onClick={() => setSelectedCategory('design')}
                        className={`w-full px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all duration-200 ${
                          selectedCategory === 'design'
                            ? 'bg-coral-50 dark:bg-coral-500/10 text-coral-600 dark:text-coral-400 font-medium'
                            : 'text-ink-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Layers className={`h-4 w-4 ${selectedCategory === 'design' ? 'text-coral-500' : 'text-ink-400'}`} />
                        Design
                        {selectedCategory === 'design' && (
                          <span className="ml-auto bg-coral-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {previewData.design.count}
                          </span>
                        )}
                      </button>

                      {/* Business */}
                      <button
                        onClick={() => setSelectedCategory('business')}
                        className={`w-full px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all duration-200 ${
                          selectedCategory === 'business'
                            ? 'bg-coral-50 dark:bg-coral-500/10 text-coral-600 dark:text-coral-400 font-medium'
                            : 'text-ink-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Layers className={`h-4 w-4 ${selectedCategory === 'business' ? 'text-coral-500' : 'text-ink-400'}`} />
                        Business
                        {selectedCategory === 'business' && (
                          <span className="ml-auto bg-coral-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {previewData.business.count}
                          </span>
                        )}
                      </button>

                      {/* Saved */}
                      <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <button
                          onClick={() => setSelectedCategory('saved')}
                          className={`w-full px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all duration-200 ${
                            selectedCategory === 'saved'
                              ? 'bg-coral-50 dark:bg-coral-500/10 text-coral-600 dark:text-coral-400 font-medium'
                              : 'text-ink-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${selectedCategory === 'saved' ? 'text-coral-500 fill-coral-500' : 'text-ink-400'}`} />
                          Saved
                          {selectedCategory === 'saved' && (
                            <span className="ml-auto bg-coral-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {previewData.saved.count}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Articles mock - Dynamic based on selection */}
                    <div className="flex-1 space-y-4">
                      {previewData[selectedCategory].articles.map((article, i) => (
                        <div
                          key={`${selectedCategory}-${i}`}
                          className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-md transition-all duration-300 animate-fade-in"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${article.saved ? 'bg-coral-400' : 'bg-coral-500'}`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-ink-900 dark:text-white mb-1">{article.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-neutral-400">
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
                            <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-ink-400 dark:text-neutral-500 transition-colors">
                              <Sparkles className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hint text */}
              <p className="text-center mt-4 text-sm text-ink-500 dark:text-neutral-400">
                Click the categories to see it in action
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-24 md:py-32 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-coral-500 font-medium text-sm uppercase tracking-wider">Features</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Everything you need to read smarter
            </h2>
            <p className="text-lg text-ink-600 dark:text-neutral-300 max-w-xl mx-auto">
              A focused set of powerful features designed to help you consume content more efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-coral-200 dark:hover:border-coral-900/50 hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-coral-500" />
                </div>
                <h3 className="font-display text-lg text-ink-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-ink-600 dark:text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Summary Feature Highlight */}
      <section className="py-24 md:py-32 bg-ink-900 dark:bg-neutral-900 text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-coral-400 font-medium text-sm uppercase tracking-wider">AI-Powered</span>
              <h2 className="font-display text-3xl md:text-4xl mt-3 mb-6">
                Read more in less time with AI summaries
              </h2>
              <p className="text-lg text-neutral-300 mb-8 leading-relaxed">
                Don't have time to read every article? Our AI analyzes content and gives you the key takeaways in seconds.
                Perfect for staying informed when you're short on time.
              </p>
              <ul className="space-y-4">
                {[
                  'Instant summaries for any article',
                  'Key points extracted automatically',
                  'Works with any language',
                  'Saves hours of reading time'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-coral-500 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-neutral-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-coral-400" />
                  <span className="font-medium">AI Summary</span>
                </div>
                <div className="space-y-3 text-neutral-300 text-sm leading-relaxed">
                  <p>
                    <strong className="text-white">Key points:</strong>
                  </p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>New framework reduces bundle size by 40%</li>
                    <li>Backwards compatible with existing code</li>
                    <li>Performance improvements in rendering</li>
                    <li>Available now in beta for testing</li>
                  </ul>
                  <p className="pt-2 text-neutral-400 text-xs">
                    Summary generated in 1.2 seconds
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-coral-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 md:py-32 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-coral-500 font-medium text-sm uppercase tracking-wider">Use Cases</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Built for how you read
            </h2>
            <p className="text-lg text-ink-600 dark:text-neutral-300 max-w-xl mx-auto">
              Whether you're a casual reader or a power user, rivsy adapts to your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              >
                <div className="w-12 h-12 rounded-xl bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center mb-5">
                  <useCase.icon className="h-6 w-6 text-coral-500" />
                </div>
                <h3 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                  {useCase.title}
                </h3>
                <p className="text-ink-600 dark:text-neutral-400 leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Features Grid */}
      <section className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-coral-500 font-medium text-sm uppercase tracking-wider">And more</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Packed with features
            </h2>
            <p className="text-lg text-ink-600 dark:text-neutral-300 max-w-xl mx-auto">
              Every tool you need for a better reading experience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center"
              >
                <feature.icon className="h-5 w-5 text-coral-500 mx-auto mb-2" />
                <h4 className="font-medium text-ink-900 dark:text-white text-sm mb-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-ink-500 dark:text-neutral-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-coral-500 font-medium text-sm uppercase tracking-wider">Getting Started</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Up and running in 60 seconds
            </h2>
            <p className="text-lg text-ink-600 dark:text-neutral-300">
              No complicated setup. Just sign up and start reading.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: '1',
                title: 'Add your feeds',
                desc: 'Paste any website URL or RSS feed. We auto-detect feeds and import them instantly.'
              },
              {
                step: '2',
                title: 'Organize your way',
                desc: 'Create categories to group your feeds. Tech, news, hobbies—organize however makes sense to you.'
              },
              {
                step: '3',
                title: 'Read smarter',
                desc: 'Browse your personalized feed. Use AI to summarize long articles. Save favorites for later.'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-coral-500 text-white font-display text-2xl flex items-center justify-center mx-auto mb-5 shadow-glow-coral">
                  {item.step}
                </div>
                <h3 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-ink-600 dark:text-neutral-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-coral-500 font-medium text-sm uppercase tracking-wider">Comparison</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Why choose rivsy?
            </h2>
            <p className="text-lg text-ink-600 dark:text-neutral-300 max-w-xl mx-auto">
              A modern alternative to outdated RSS readers.
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <div className="text-sm font-medium text-ink-900 dark:text-white">Feature</div>
              <div className="text-sm font-medium text-coral-500 text-center">rivsy</div>
              <div className="text-sm font-medium text-ink-500 dark:text-neutral-400 text-center">Others</div>
            </div>
            {comparisonPoints.map((point, index) => (
              <div
                key={index}
                className={`grid grid-cols-3 gap-4 p-4 ${index !== comparisonPoints.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}
              >
                <div className="text-sm text-ink-700 dark:text-neutral-200">{point.feature}</div>
                <div className="flex justify-center">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-sm text-ink-500 dark:text-neutral-400 text-center">{point.others}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 md:py-32" id="pricing">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-coral-500 font-medium text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 dark:text-white mt-3 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-ink-600 dark:text-neutral-300">
              Start free, upgrade when you need more AI power.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h3 className="font-display text-2xl text-ink-900 dark:text-white mb-2">Free</h3>
              <p className="text-ink-500 dark:text-neutral-400 text-sm mb-4">Perfect for getting started</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-display text-ink-900 dark:text-white">$0</span>
                <span className="text-ink-500 dark:text-neutral-400">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited RSS feeds',
                  '5 AI summaries per month',
                  'All categories & folders',
                  'Keyboard shortcuts',
                  'Dark mode',
                  'Mobile-friendly'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-ink-700 dark:text-neutral-200">
                    <Check className="h-5 w-5 text-coral-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <SignUpButton mode="modal">
                <button className="btn btn-secondary w-full">
                  Get started free
                </button>
              </SignUpButton>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-coral-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-coral-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>

              <h3 className="font-display text-2xl text-ink-900 dark:text-white mb-2">Pro</h3>
              <p className="text-ink-500 dark:text-neutral-400 text-sm mb-4">For power readers</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-display text-ink-900 dark:text-white">$9</span>
                <span className="text-ink-500 dark:text-neutral-400">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Free',
                  '150 AI summaries per month',
                  'Full-text search',
                  'Priority feed updates',
                  'Export & backup',
                  'Priority support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-ink-700 dark:text-neutral-200">
                    <Check className="h-5 w-5 text-coral-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <SignUpButton mode="modal">
                <button className="btn btn-primary w-full">
                  Start 14-day free trial
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 bg-ink-900 dark:bg-neutral-900 border-t border-neutral-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white mb-6">
            Ready to simplify your reading?
          </h2>
          <p className="text-lg text-neutral-300 mb-10 max-w-xl mx-auto">
            Join readers who use rivsy to stay informed without the noise.
            Set up in 60 seconds, free forever.
          </p>
          <SignUpButton mode="modal">
            <button className="bg-coral-500 hover:bg-coral-600 text-white px-8 py-4 rounded-2xl font-medium text-lg transition-all hover:shadow-glow-coral hover:-translate-y-0.5">
              Create free account
              <ArrowRight className="inline-block ml-2 h-5 w-5" />
            </button>
          </SignUpButton>
          <p className="mt-6 text-sm text-neutral-400">
            No credit card required · Free plan available forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
