import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center p-6">
        <div className="text-xl font-bold">GA4 Monitor</div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="text-center px-4 py-20 max-w-7xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-50">
          Monitor Your GA4 Properties with Confidence
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xl mb-8 max-w-2xl mx-auto">
          Automated daily checks to ensure your analytics tracking is working correctly. 
          Get instant alerts for unusual traffic drops.
        </p>
        <Button size="lg" asChild>
          <Link href="/dashboard">Get Started</Link>
        </Button>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="w-6 h-6">⏰</span>
              Daily Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Automated checks every day at 23:00 to verify your GA4 properties are tracking correctly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="w-6 h-6">🔄</span>
              Multi-Account Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Monitor multiple GA4 accounts and properties from a single dashboard.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="w-6 h-6">🔍</span>
              Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Intelligent alerts when traffic patterns show unusual changes or drops.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="w-6 h-6">👆</span>
              Manual Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Run instant checks on demand with a single click whenever you need.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
