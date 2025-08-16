import Link from 'next/link'
import { Mic, Calendar, ArrowRight } from 'lucide-react'

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "How to Use Socratic Questioning for Better Learning",
      excerpt: "Discover the power of asking the right questions to deepen your understanding and improve retention.",
      date: "December 15, 2024",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "The Science Behind Effective Note-Taking",
      excerpt: "Learn research-backed strategies for taking notes that actually help you remember and understand.",
      date: "December 10, 2024",
      readTime: "7 min read"
    },
    {
      id: 3,
      title: "Building a Study Routine That Actually Works",
      excerpt: "Practical tips for creating a study schedule that fits your lifestyle and maximizes productivity.",
      date: "December 5, 2024",
      readTime: "6 min read"
    },
    {
      id: 4,
      title: "Why Audio Learning is More Effective Than Reading",
      excerpt: "Explore the cognitive benefits of learning through audio and how to leverage them in your studies.",
      date: "November 30, 2024",
      readTime: "8 min read"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Mic className="h-8 w-8 text-gray-900" />
            <span className="text-xl font-bold text-gray-900">ThinkNote AI</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/apps-and-integrations" className="text-gray-700 hover:text-gray-900 transition-colors">
              Apps & Integrations
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            ThinkNote AI Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights, tips, and strategies to help you study smarter, not harder.
          </p>
        </div>

        {/* Blog Posts */}
        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="border-b border-gray-200 pb-8 last:border-b-0">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-gray-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{post.date}</span>
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 mt-2" />
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h3>
          <p className="text-gray-600 mb-6">
            Get the latest study tips and AI learning insights delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-w-[300px]"
            />
            <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
