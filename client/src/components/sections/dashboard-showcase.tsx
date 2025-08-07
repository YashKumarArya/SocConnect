import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Shield, AlertTriangle, BarChart3, Workflow, Users, FileText } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface FeatureStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  visual: string;
}

const featureSteps: FeatureStep[] = [
  {
    id: "unified-threat",
    title: "Unified Threat Overview",
    description: "Get complete visibility into threat landscape — by severity, source, and impact across all your security tools and endpoints.",
    icon: Shield,
    visual: "threat-overview"
  },
  {
    id: "alert-triage",
    title: "AI-Powered Alert Triage",
    description: "Automatically classify and prioritize alerts using advanced AI scoring for true positives, false positives, and escalation paths.",
    icon: AlertTriangle,
    visual: "alert-triage"
  },
  {
    id: "tactical-analytics",
    title: "Real-Time Tactical Analytics",
    description: "Track attacker behavior patterns, analyze file execution paths, and correlate process execution across your infrastructure.",
    icon: BarChart3,
    visual: "analytics"
  },
  {
    id: "automated-playbooks",
    title: "Automated Response Playbooks",
    description: "Instantly isolate compromised devices, block malicious hashes, and notify security teams with predefined automated playbooks.",
    icon: Workflow,
    visual: "playbooks"
  },
  {
    id: "user-entity",
    title: "User Entity Behavior Analytics",
    description: "Correlate security alerts back to specific users, domains, and asset movement patterns for comprehensive threat context.",
    icon: Users,
    visual: "entity-mapping"
  },
  {
    id: "compliance",
    title: "Compliance & Audit Reporting",
    description: "Generate audit-ready compliance reports automatically mapped to ISO 27001, NIST Framework, SOC 2, and industry standards.",
    icon: FileText,
    visual: "compliance"
  }
];

export default function DashboardShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create scroll-triggered animations for each section
    featureSteps.forEach((_, index) => {
      const sectionSelector = `.feature-section-${index}`;
      const titleSelector = `${sectionSelector} .feature-title`;
      const descSelector = `${sectionSelector} .feature-description`;
      const visualSelector = `${sectionSelector} .feature-visual`;

      ScrollTrigger.create({
        trigger: sectionSelector,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          // Typewriter animation for title
          const titleElement = container.querySelector(titleSelector);
          if (titleElement) {
            const titleText = titleElement.textContent || "";
            titleElement.textContent = "";
            titleElement.style.opacity = "1";

            gsap.to({}, {
              duration: titleText.length * 0.05,
              ease: "none",
              onUpdate: function() {
                const progress = this.progress();
                const currentLength = Math.floor(progress * titleText.length);
                titleElement.textContent = titleText.substring(0, currentLength);
              }
            });
          }

          // Typewriter animation for description with delay
          setTimeout(() => {
            const descElement = container.querySelector(descSelector);
            if (descElement) {
              const descText = descElement.textContent || "";
              descElement.textContent = "";
              descElement.style.opacity = "1";

              gsap.to({}, {
                duration: descText.length * 0.02,
                ease: "none",
                onUpdate: function() {
                  const progress = this.progress();
                  const currentLength = Math.floor(progress * descText.length);
                  descElement.textContent = descText.substring(0, currentLength);
                }
              });
            }
          }, 800);

          // Visual fade-in with slide
          gsap.fromTo(visualSelector,
            { y: 80, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.3 }
          );
        }
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const renderVisual = (visual: string) => {
    const baseClasses = "w-full h-full rounded-xl border border-[hsl(330,100%,50%)]/20 bg-gradient-to-br from-[hsl(220,15%,8%)] to-[hsl(220,15%,5%)] p-6 relative overflow-hidden backdrop-blur-sm";

    switch (visual) {
      case "threat-overview":
        return (
          <div className={baseClasses}>
            {/* Enhanced Background Grid */}
            <div className="absolute inset-0 opacity-5">
              <div className="grid grid-cols-12 grid-rows-12 gap-px h-full">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[hsl(330,100%,50%)] rounded-sm animate-pulse"
                    style={{
                      animationDelay: `${i * 30}ms`,
                      animationDuration: `${2 + (i % 3)}s`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-[hsl(330,100%,50%)] rounded-full animate-pulse opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 grid grid-cols-2 gap-6 h-full">
              {/* Threat Categories */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-[hsl(330,100%,50%)] rounded-full mr-2 animate-pulse"></div>
                  Threat Categories
                </h4>
                {[
                  { name: "Critical", count: 23, color: "red", percentage: 78 },
                  { name: "High", count: 156, color: "orange", percentage: 65 },
                  { name: "Medium", count: 342, color: "yellow", percentage: 45 },
                  { name: "Low", count: 1326, color: "green", percentage: 25 }
                ].map((threat, i) => (
                  <div key={i} className="space-y-2 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${threat.color}-500 group-hover:scale-110 transition-transform duration-300`}></div>
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{threat.name}</span>
                        <span className="text-xs text-gray-500">({threat.count.toLocaleString()})</span>
                      </div>
                      <span className="text-xs font-mono text-[hsl(330,100%,50%)] group-hover:scale-110 transition-transform">{threat.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700/40 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r from-${threat.color}-500/60 to-${threat.color}-500 rounded-full transition-all duration-2000 animate-pulse`}
                        style={{
                          width: `${threat.percentage}%`,
                          animationDelay: `${i * 200}ms`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Live Dashboard */}
              <div className="bg-[hsl(0,0%,6%)]/80 rounded-xl p-4 border border-[hsl(330,100%,50%)]/20 backdrop-blur-sm relative overflow-hidden">
                {/* Scanning line effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[hsl(330,100%,50%)] to-transparent animate-ping" style={{ top: '30%' }}></div>
                </div>

                <div className="text-center mb-4 relative z-10">
                  <div className="text-3xl font-bold text-[hsl(330,100%,50%)] mb-1 animate-pulse">1,847</div>
                  <div className="text-xs text-gray-400">Active Threats Detected</div>
                  <div className="text-xs text-[hsl(267,100%,67%)] mt-1">Live monitoring • Updated 2s ago</div>
                </div>

                {/* Enhanced Real-time Activity Feed */}
                <div className="space-y-2 text-xs relative z-10">
                  {[
                    { type: "Malware detected", severity: "red", time: "12:34:56" },
                    { type: "Suspicious traffic", severity: "yellow", time: "12:34:52" },
                    { type: "Brute force attempt", severity: "orange", time: "12:34:48" },
                    { type: "Policy violation", severity: "blue", time: "12:34:44" }
                  ].map((alert, i) => (
                    <div key={i} className={`flex items-center justify-between py-2 px-3 bg-${alert.severity}-500/10 rounded-lg border-l-2 border-${alert.severity}-500 hover:bg-${alert.severity}-500/20 transition-all duration-300 group`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 bg-${alert.severity}-500 rounded-full animate-pulse group-hover:scale-125 transition-transform`}></div>
                        <span className={`text-${alert.severity}-300 group-hover:text-${alert.severity}-200 transition-colors`}>{alert.type}</span>
                      </div>
                      <span className="text-gray-500 font-mono">{alert.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "alert-triage":
        return (
          <div className={baseClasses}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-300 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  AI Alert Triage Engine
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs text-green-400">Processing</span>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {[
                  { id: "ALT-2024-001", type: "Malware", confidence: 95, severity: "Critical", source: "Endpoint", status: "analyzing" },
                  { id: "ALT-2024-002", type: "Phishing", confidence: 87, severity: "High", source: "Email", status: "confirmed" },
                  { id: "ALT-2024-003", type: "Anomaly", confidence: 72, severity: "Medium", source: "Network", status: "pending" },
                  { id: "ALT-2024-004", type: "Policy", confidence: 45, severity: "Low", source: "User", status: "dismissed" }
                ].map((alert, i) => (
                  <div key={i} className="p-3 bg-[hsl(0,0%,6%)]/80 rounded-xl border border-gray-700/30 hover:border-[hsl(330,100%,50%)]/40 transition-all duration-300 group backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full group-hover:scale-110 transition-transform ${
                          alert.severity === 'Critical' ? 'bg-red-500 animate-pulse' :
                          alert.severity === 'High' ? 'bg-orange-500' :
                          alert.severity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="text-sm font-mono text-gray-300 group-hover:text-white transition-colors">{alert.id}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50 text-gray-400 group-hover:bg-gray-600/50 transition-colors">{alert.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-[hsl(330,100%,50%)] text-sm font-mono group-hover:scale-105 transition-transform">{alert.confidence}%</div>
                        <div className={`w-2 h-2 rounded-full ${
                          alert.status === 'analyzing' ? 'bg-blue-500 animate-pulse' :
                          alert.status === 'confirmed' ? 'bg-green-500' :
                          alert.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                          'bg-gray-500'
                        }`}></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-400">Source: <span className="text-white group-hover:text-[hsl(330,100%,50%)] transition-colors">{alert.source}</span></span>
                        <span className="text-gray-400">Severity: <span className={`transition-colors ${
                          alert.severity === 'Critical' ? 'text-red-400' :
                          alert.severity === 'High' ? 'text-orange-400' :
                          alert.severity === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                        }`}>{alert.severity}</span></span>
                      </div>

                      <div className="flex space-x-1">
                        <button className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/40 transition-all duration-200 hover:scale-105">Accept</button>
                        <button className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/40 transition-all duration-200 hover:scale-105">Reject</button>
                      </div>
                    </div>

                    {/* Enhanced AI Confidence Bar */}
                    <div className="mt-2">
                      <div className="w-full bg-gray-700/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full transition-all duration-1000 relative"
                          style={{ width: `${alert.confidence}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className={baseClasses}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-300 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-[hsl(330,100%,50%)]" />
                  Tactical Analytics Dashboard
                </h4>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-xs bg-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)] rounded-md border border-[hsl(330,100%,50%)]/20 hover:bg-[hsl(330,100%,50%)]/30 transition-all">Live</button>
                  <button className="px-3 py-1 text-xs bg-gray-700/50 text-gray-400 rounded-md hover:bg-gray-600/50 transition-all">Historical</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: "Avg Response Time", value: "2.3s", color: "hsl(330,100%,50%)", trend: "down" },
                  { label: "Accuracy Rate", value: "98.7%", color: "green-400", trend: "up" }
                ].map((metric, i) => (
                  <div key={i} className="text-center p-3 bg-[hsl(0,0%,6%)]/80 rounded-xl border border-gray-700/30 hover:border-[hsl(330,100%,50%)]/20 transition-all duration-300 group">
                    <div className={`text-lg font-bold text-${metric.color} group-hover:scale-105 transition-transform`}>{metric.value}</div>
                    <div className="text-xs text-gray-400">{metric.label}</div>
                    <div className={`text-xs mt-1 ${metric.trend === 'up' ? 'text-green-400' : 'text-blue-400'}`}>
                      {metric.trend === 'up' ? '↗' : '↘'} Trending {metric.trend}
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Interactive Chart Area */}
              <div className="flex-1 relative bg-[hsl(0,0%,6%)]/60 rounded-xl border border-gray-700/30 p-4 overflow-hidden">
                {/* Chart background grid */}
                <div className="absolute inset-4">
                  <svg className="w-full h-full opacity-10" viewBox="0 0 300 150">
                    <defs>
                      <pattern id="chartGrid" width="30" height="15" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 15" fill="none" stroke="hsl(330,100%,50%)" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#chartGrid)"/>
                  </svg>
                </div>

                {/* Main chart */}
                <svg className="w-full h-full relative z-10" viewBox="0 0 300 150">
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="hsl(330,100%,50%)" stopOpacity="0.4"/>
                      <stop offset="50%" stopColor="hsl(267,100%,67%)" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="hsl(330,100%,50%)" stopOpacity="0"/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Data area */}
                  <path
                    d="M15,120 Q45,80 75,90 T135,70 T195,85 T255,75 T285,65 L285,130 L15,130 Z"
                    fill="url(#areaGradient)"
                  />

                  {/* Data line */}
                  <path
                    d="M15,120 Q45,80 75,90 T135,70 T195,85 T255,75 T285,65"
                    fill="none"
                    stroke="hsl(330,100%,50%)"
                    strokeWidth="2"
                    filter="url(#glow)"
                    className="animate-pulse"
                  />

                  {/* Animated data points */}
                  {[
                    { x: 75, y: 90 }, { x: 135, y: 70 }, { x: 195, y: 85 }, { x: 255, y: 75 }
                  ].map((point, i) => (
                    <g key={i}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="hsl(330,100%,50%)"
                        filter="url(#glow)"
                        className="animate-pulse cursor-pointer"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="8"
                        fill="none"
                        stroke="hsl(330,100%,50%)"
                        strokeWidth="1"
                        opacity="0.3"
                        className="animate-ping"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    </g>
                  ))}
                </svg>

                {/* Enhanced Hover Tooltips */}
                <div className="absolute top-2 right-2 text-xs text-gray-400 bg-[hsl(0,0%,6%)]/80 rounded-lg p-2 border border-gray-700/30">
                  <div className="text-white">Attack Pattern Analysis</div>
                  <div className="text-[hsl(330,100%,50%)]">Last 24h • Live</div>
                  <div className="text-[hsl(267,100%,67%)] text-xs mt-1">Next update: 30s</div>
                </div>
              </div>
            </div>
          </div>
        );

      case "playbooks":
        return (
          <div className={baseClasses}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-300 flex items-center">
                  <Workflow className="w-4 h-4 mr-2 text-[hsl(330,100%,50%)]" />
                  Automated Playbook Engine
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-blue-400">Executing</span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {[
                  { step: "Detect", desc: "AI identifies threat patterns", icon: "🔍", time: "0.2s", status: "complete" },
                  { step: "Analyze", desc: "Context enrichment & correlation", icon: "🧠", time: "0.8s", status: "complete" },
                  { step: "Contain", desc: "Isolate affected systems", icon: "🛡️", time: "1.2s", status: "active" },
                  { step: "Remediate", desc: "Automated threat removal", icon: "🔧", time: "2.1s", status: "pending" }
                ].map((playbook, i) => {
                  const isActive = i <= 2;
                  const isCurrent = i === 2;

                  return (
                    <div key={i} className="relative">
                      {/* Enhanced Connection Line */}
                      {i < 3 && (
                        <div className="absolute left-4 top-12 w-px h-6">
                          <div className={`w-full h-full transition-all duration-1000 ${
                            isActive ? 'bg-gradient-to-b from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)]' : 'bg-gray-600'
                          }`}></div>
                          {isActive && (
                            <div className="absolute inset-0 w-full bg-gradient-to-b from-[hsl(330,100%,50%)] to-transparent animate-pulse"></div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 p-4 bg-[hsl(0,0%,6%)]/80 rounded-xl border border-gray-700/30 hover:border-[hsl(330,100%,50%)]/30 transition-all duration-300 group">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all duration-500 relative ${
                          isActive ?
                          'border-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]' :
                          'border-gray-600 text-gray-400'
                        }`}>
                          <span className="relative z-10">{playbook.icon}</span>
                          {isCurrent && (
                            <div className="absolute inset-0 rounded-full border-2 border-[hsl(330,100%,50%)] animate-ping"></div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium transition-colors group-hover:text-[hsl(330,100%,50%)] ${
                              isActive ? 'text-white' : 'text-gray-400'
                            }`}>
                              {playbook.step}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-[hsl(330,100%,50%)] font-mono">
                                {playbook.time}
                              </span>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                playbook.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                                playbook.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {playbook.status}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">{playbook.desc}</p>

                          {/* Enhanced Progress Bar */}
                          <div className="mt-3 w-full bg-gray-700/40 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 relative ${
                                isActive ? 'bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)]' : 'bg-gray-600'
                              } ${isActive ? 'w-full' : 'w-0'}`}
                            >
                              {isCurrent && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Enhanced Status Footer */}
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="text-sm text-green-400 font-medium flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Playbook Status: Active
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Last execution: 2 minutes ago • Success rate: 99.2%</div>
                </div>
              </div>
            </div>
          </div>
        );

      case "entity-mapping":
        return (
          <div className={baseClasses}>
            <div className="relative h-full overflow-hidden">
              {/* Network visualization background */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 400 300">
                  {/* Connection lines */}
                  {[
                    { x1: 100, y1: 150, x2: 200, y2: 100 },
                    { x1: 100, y1: 150, x2: 200, y2: 200 },
                    { x1: 200, y1: 100, x2: 300, y2: 150 },
                    { x1: 200, y1: 200, x2: 300, y2: 150 },
                    { x1: 300, y1: 150, x2: 350, y2: 100 },
                    { x1: 300, y1: 150, x2: 350, y2: 200 }
                  ].map((line, i) => (
                    <line
                      key={i}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="hsl(330,100%,50%)"
                      strokeWidth="1"
                      className="animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </svg>
              </div>

              <div className="relative z-10 h-full flex flex-col">
                <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-[hsl(330,100%,50%)]" />
                  User Entity Behavior Analytics
                </h4>

                <div className="flex-1 grid grid-cols-3 gap-6 items-center">
                  {[
                    { name: "John Doe", role: "Admin", risk: "High", activities: 47 },
                    { name: "Sarah Chen", role: "User", risk: "Medium", activities: 23 },
                    { name: "Mike Johnson", role: "Guest", risk: "Low", activities: 12 }
                  ].map((user, i) => (
                    <div key={i} className="text-center group">
                      <div className="relative mb-3">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-r mx-auto transition-all duration-500 group-hover:scale-110 ${
                          user.risk === 'High' ? 'from-red-500 to-red-600 animate-pulse' :
                          user.risk === 'Medium' ? 'from-yellow-500 to-yellow-600' :
                          'from-green-500 to-green-600'
                        }`}>
                          <div className="w-full h-full rounded-full border-2 border-white/20 flex items-center justify-center text-white font-bold text-lg">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>

                        {/* Risk indicator */}
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[hsl(220,15%,5%)] ${
                          user.risk === 'High' ? 'bg-red-500 animate-pulse' :
                          user.risk === 'Medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm font-medium text-white group-hover:text-[hsl(330,100%,50%)] transition-colors">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.role}</div>
                        <div className={`text-xs font-medium ${
                          user.risk === 'High' ? 'text-red-400' :
                          user.risk === 'Medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {user.risk} Risk
                        </div>
                        <div className="text-xs text-gray-500">{user.activities} activities</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Activity timeline */}
                <div className="mt-6 p-3 bg-[hsl(0,0%,6%)]/80 rounded-xl border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-2">Recent Activity Timeline</div>
                  <div className="flex space-x-1">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          Math.random() > 0.7 ? 'h-6 bg-red-500' :
                          Math.random() > 0.5 ? 'h-4 bg-yellow-500' :
                          'h-2 bg-green-500'
                        }`}
                        style={{ animationDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "compliance":
        return (
          <div className={baseClasses}>
            <div className="h-full flex flex-col">
              <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-[hsl(330,100%,50%)]" />
                Compliance & Audit Reporting
              </h4>

              <div className="space-y-4 flex-1">
                {[
                  { name: "ISO 27001", score: 94, color: "green", lastAudit: "2 days ago" },
                  { name: "NIST Framework", score: 89, color: "blue", lastAudit: "1 week ago" },
                  { name: "SOC 2 Type II", score: 96, color: "purple", lastAudit: "3 days ago" },
                  { name: "GDPR Compliance", score: 92, color: "orange", lastAudit: "5 days ago" }
                ].map((standard, i) => (
                  <div key={i} className="p-4 bg-[hsl(0,0%,6%)]/80 rounded-xl border border-gray-700/30 hover:border-[hsl(330,100%,50%)]/30 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm font-medium text-white group-hover:text-[hsl(330,100%,50%)] transition-colors">{standard.name}</span>
                        <div className="text-xs text-gray-400 mt-1">Last audit: {standard.lastAudit}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[hsl(330,100%,50%)]">{standard.score}%</div>
                        <div className="text-xs text-green-400">Compliant</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-700/40 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full transition-all duration-1000 relative"
                          style={{ width: `${standard.score}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      <span className="text-xs text-[hsl(330,100%,50%)] font-mono">{standard.score}%</span>
                    </div>

                    {/* Mini compliance breakdown */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {['Controls', 'Policies', 'Procedures'].map((item, j) => (
                        <div key={j} className="text-center">
                          <div className="text-xs text-gray-400">{item}</div>
                          <div className="text-xs font-mono text-green-400">{Math.floor(Math.random() * 10) + 90}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Report generation footer */}
              <div className="mt-4 p-3 bg-[hsl(0,0%,6%)]/80 rounded-xl border border-[hsl(330,100%,50%)]/20 text-center">
                <button className="w-full bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] text-white py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  Generate Compliance Report
                </button>
                <div className="text-xs text-gray-400 mt-2">Auto-generated reports available 24/7</div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className={baseClasses}></div>;
    }
  };

  return (
    <div ref={containerRef} className="dashboard-showcase relative bg-[hsl(220,15%,5%)] py-20">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(330,100%,50%)]/5 to-[hsl(267,100%,67%)]/5"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(330,100%,50%)_0px,transparent_50%)] opacity-10"></div>

      {/* Section heading */}
      <div className="container mx-auto max-w-7xl px-6 mb-20">
        <div className="text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            AI-Powered Security Operations
          </h2>
          <p className="text-gray-300 text-xl max-w-3xl mx-auto">
            Experience next-generation cybersecurity with our intelligent SOC platform
          </p>
        </div>
      </div>

      {/* Feature sections */}
      <div className="space-y-32">
        {featureSteps.map((step, index) => (
          <div
            key={step.id}
            className={`feature-section-${index} container mx-auto max-w-7xl px-6`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-center">
              {/* Left Panel - Text Content */}
              <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    {(() => {
                      const IconComponent = step.icon;
                      return <IconComponent className="w-10 h-10 text-[hsl(330,100%,50%)]" />;
                    })()}
                    <span className="text-sm text-[hsl(330,100%,50%)] font-mono bg-[hsl(330,100%,50%)]/10 px-3 py-1 rounded-full">
                      {String(index + 1).padStart(2, '0')} / {String(featureSteps.length).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="feature-title text-4xl lg:text-5xl font-bold text-white leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent opacity-0">
                    {step.title}
                  </h3>

                  <p className="feature-description text-gray-300 text-xl leading-relaxed opacity-0">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Right Panel - Visual Content */}
              <div className="flex items-center justify-center">
                <div className="w-full h-96 lg:h-[600px] relative">
                  <div className="w-full h-full relative feature-visual">
                    {/* Glow effect behind visual */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[hsl(330,100%,50%)]/10 to-[hsl(267,100%,67%)]/10 rounded-2xl blur-xl"></div>
                    <div className="relative z-10">
                      {renderVisual(step.visual)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}