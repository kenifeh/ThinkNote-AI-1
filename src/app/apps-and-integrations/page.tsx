import Link from 'next/link'
import { Mic, Zap, Database, Cloud } from 'lucide-react'

export default function AppsAndIntegrationsPage() {
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
            <Link href="/pricing" className="text-gray-700 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-gray-900 transition-colors">
              Blog
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Apps & Integrations
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect ThinkNote AI with your favorite tools and platforms for seamless study workflows.
          </p>
        </div>

        {/* Integration Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Coming Soon Placeholders */}
          {[
            { name: 'Notion Integration', icon: Database, description: 'Sync your study notes and transcripts directly to Notion' },
            { name: 'Google Drive', icon: Cloud, description: 'Import and export files from Google Drive' },
            { name: 'Slack Bot', icon: Zap, description: 'Get study reminders and quick access to your materials' },
            { name: 'Chrome Extension', icon: Zap, description: 'Capture web content and convert to study materials' },
            { name: 'Mobile App', icon: Mic, description: 'Study on the go with our mobile companion app' },
            { name: 'API Access', icon: Database, description: 'Build custom integrations with our developer API' }
          ].map((integration, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <div className="bg-gray-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <integration.icon className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{integration.name}</h3>
              <p className="text-gray-600 mb-6">{integration.description}</p>
              <span className="inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                Coming Soon
              </span>
            </div>
          ))}
        </div>

        {/* Developer Section */}
        <div className="mt-24 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Want to Build an Integration?
          </h2>
                      <p className="text-lg text-gray-600 mb-8">
              We&apos;re working on our developer API. Sign up to be notified when it&apos;s available.
            </p>
          <button className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
            Join Waitlist
          </button>
        </div>
      </main>
    </div>
  )
}
