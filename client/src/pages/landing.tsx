import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Eye, TrendingUp } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-white">SOC Dashboard</h1>
          </div>
          <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Advanced Security Operations Center
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
            Real-time threat detection, automated incident response, and comprehensive analytics 
            for modern cybersecurity teams.
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
              <CardTitle className="text-white">Real-time Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Instant threat detection and alerting from multiple security sources.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Eye className="w-10 h-10 text-blue-500 mb-4" />
              <CardTitle className="text-white">Incident Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Streamlined incident tracking, assignment, and resolution workflows.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <TrendingUp className="w-10 h-10 text-green-500 mb-4" />
              <CardTitle className="text-white">Analytics & Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Comprehensive performance metrics and automated reporting.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Shield className="w-10 h-10 text-purple-500 mb-4" />
              <CardTitle className="text-white">Threat Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Advanced threat correlation and intelligence integration.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Trusted by Security Teams Worldwide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-2">99.9%</div>
              <div className="text-slate-400">Uptime Reliability</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-500 mb-2">&lt;2min</div>
              <div className="text-slate-400">Average Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-500 mb-2">24/7</div>
              <div className="text-slate-400">Continuous Monitoring</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <p>&copy; 2024 SOC Dashboard. Secure by design.</p>
        </div>
      </footer>
    </div>
  );
}