"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, AlertTriangle, Eye, Target, Activity, Brain, TrendingUp, Clock, CheckCircle, X } from 'lucide-react';
import { Button } from './button';

interface DataSource {
  id: string
  name: string
  position: { x: number; y: number }
  isActive: boolean
  color: string
}

interface ThreatFlow {
  id: string
  sourceId: string
  progress: number
  classification: "true-positive" | "false-positive" | "manual" | null
  phase: "to-brain" | "processing" | "to-classification" | "completed"
  color: string
}

interface ClassificationStack {
  "true-positive": string[]
  "false-positive": string[]
  "manual": string[]
}

const dataSources: DataSource[] = [
  { id: "1", name: "NCFW", position: { x: 60, y: 30 }, isActive: false, color: "#3B82F6" },
  { id: "2", name: "Amazon", position: { x: 30, y: 60 }, isActive: false, color: "#10B981" },
  { id: "3", name: "Azure", position: { x: 30, y: 90 }, isActive: false, color: "#8B5CF6" },
  { id: "4", name: "Office 365", position: { x: 30, y: 120 }, isActive: false, color: "#F59E0B" },
  { id: "5", name: "SharePoint", position: { x: 30, y: 150 }, isActive: false, color: "#EF4444" },
  { id: "6", name: "Apache", position: { x: 30, y: 180 }, isActive: false, color: "#06B6D4" },
  { id: "7", name: "Prisma Cloud", position: { x: 30, y: 210 }, isActive: false, color: "#84CC16" },
]

export function ThreatVisualization() {
  const [sources, setSources] = useState<DataSource[]>(dataSources)
  const [threatFlows, setThreatFlows] = useState<ThreatFlow[]>([])
  const [classificationStacks, setClassificationStacks] = useState<ClassificationStack>({
    "true-positive": [],
    "false-positive": [],
    "manual": [],
  })
  const [rotationAngle, setRotationAngle] = useState(0)
  const [outputWires, setOutputWires] = useState({ tp: false, fp: false, manual: false })
  const [threatCount, setThreatCount] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const [showAgentPopup, setShowAgentPopup] = useState(false);

  const agentAnalysisData = {
    status: "Active",
    confidence: 96.8,
    totalEvents: "2.3M",
    processedToday: 14672,
    threatsStopped: 847,
    falsePositives: 23,
    avgResponseTime: "1.2s",
    models: [
      { name: "Threat Detection Engine", accuracy: 94.2, status: "optimal" },
      { name: "Behavioral Analytics", accuracy: 91.7, status: "active" },
      { name: "ML Anomaly Detector", accuracy: 89.3, status: "learning" }
    ],
    recentActions: [
      { type: "Blocked", description: "Suspicious PowerShell execution", time: "2 min ago" },
      { type: "Quarantined", description: "Potential malware detected", time: "5 min ago" },
      { type: "Analyzed", description: "Network anomaly investigation", time: "12 min ago" }
    ]
  };

  // ===== Layout =====
  // RIGHT SIDE (unchanged)
  const truePositiveCenter = { x: 500, y: 80 }
  const falsePositiveCenter  = { x: 500, y: 200 }
  const manualCenter         = { x: 500, y: 340 }

  // Canvas width stays fixed; height will be computed dynamically
  const CANVAS_W = 620

  // Brain
  const brainCenter = { x: 260, y: 220 }

  // Left sources panel geometry
  const rowHeight = 24
  const leftPanelWidth  = 180
  const leftPanelX      = 120 - leftPanelWidth
  const leftPanelY      = 40
  const leftPanelHeight = 64 + sources.length * rowHeight + 32

  // Headings (unchanged)
  const headingBoxWidth  = 130
  const headingBoxHeight = 28
  const tpHeadingX       = truePositiveCenter.x + 12
  const tpHeadingY       = leftPanelY
  const fpHeadingX       = falsePositiveCenter.x + 12
  const fpHeadingY       = falsePositiveCenter.y - headingBoxHeight / 2
  const manualHeadingX   = manualCenter.x + 12
  const manualHeadingY   = manualCenter.y - headingBoxHeight / 2

  // —— Bottom 4 cards: just below the lowest content ——
  const bottomCardsX      = leftPanelX
  const bottomGap         = 16 // small visual gap to the figure above
  const figureBottom = Math.max(
    leftPanelY + leftPanelHeight,       // bottom of sources panel
    brainCenter.y + 80,                 // brain lower extent
    manualHeadingY + headingBoxHeight,  // lowest right heading bottom
  )
  const bottomCardsY      = figureBottom + bottomGap
  const bottomCardsWidth  = CANVAS_W - bottomCardsX - 20
  const bottomCardsHeight = 70

  // === Dynamic canvas/container height to remove bottom empty gap ===
  const bottomPadding     = 46
  const CANVAS_H          = bottomCardsY + bottomCardsHeight + bottomPadding
  const containerHeight   = CANVAS_H; // keeps visual size, no scaling

  // ===== Effects (logic unchanged) =====
  useEffect(() => {
    const t = setInterval(() => setRotationAngle((p) => (p + 1) % 360), 60)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      const randomSource = sources[Math.floor(Math.random() * sources.length)]
      const newThreat: ThreatFlow = {
        id: `threat-${Date.now()}`,
        sourceId: randomSource.id,
        progress: 0,
        classification: null,
        phase: "to-brain",
        color: randomSource.color,
      }
      setSources((prev) => prev.map((s) => (s.id === randomSource.id ? { ...s, isActive: true } : s)))
      setThreatFlows((prev) => [...prev, newThreat])
      setThreatCount((prev) => prev + 1)
      setTimeout(() => {
        setSources((prev) => prev.map((s) => (s.id === randomSource.id ? { ...s, isActive: false } : s)))
      }, 2000)
    }, 1800)
    return () => clearInterval(t)
  }, [sources])

  useEffect(() => {
    const t = setInterval(() => {
      setThreatFlows((prev) =>
        prev.map((flow) => {
          if (flow.phase === "to-brain" && flow.progress >= 100) {
            const r = Math.random()
            const classification: ThreatFlow["classification"] =
              r > 0.6 ? "true-positive" : r > 0.3 ? "false-positive" : "manual"

            if (classification === "true-positive") {
              setOutputWires((p) => ({ ...p, tp: true }))
              setTimeout(() => setOutputWires((p) => ({ ...p, tp: false })), 2000)
            } else if (classification === "false-positive") {
              setOutputWires((p) => ({ ...p, fp: true }))
              setTimeout(() => setOutputWires((p) => ({ ...p, fp: false })), 2000)
            } else {
              setOutputWires((p) => ({ ...p, manual: true }))
              setTimeout(() => setOutputWires((p) => ({ ...p, manual: false })), 2000)
            }

            return { ...flow, classification, phase: "to-classification", progress: 0 }
          }

          if (flow.phase === "to-classification" && flow.progress >= 100) {
            if (flow.classification) {
              setClassificationStacks((prevStacks) => ({
                ...prevStacks,
                [flow.classification!]: [...prevStacks[flow.classification!].slice(-4), flow.sourceId],
              }))
            }
            return { ...flow, phase: "completed" }
          }

          if (flow.phase === "completed") return flow
          return { ...flow, progress: Math.min(flow.progress + 3, 100) }
        }),
      )
    }, 50)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setThreatFlows((prev) =>
        prev.filter((f) => f.phase !== "completed" || Date.now() - Number.parseInt(f.id.split("-")[1]) < 1000),
      )
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // ===== Paths =====
  const getSourceWirePath = (source: DataSource) => {
    const startX = 120
    const startY = source.position.y + 60
    const endX = brainCenter.x - 45
    const endY = brainCenter.y
    const c1x = startX + 50
    const c1y = startY + (endY - startY) * 0.3
    const c2x = endX - 40
    const c2y = endY + (startY - endY) * 0.2
    return `M ${startX} ${startY} C ${c1x} ${c1y} ${c2x} ${c2y} ${endX} ${endY}`
  }

  const getOutputPath = (target: { x: number; y: number }) => {
    const startX = brainCenter.x + 45
    const startY = brainCenter.y
    const endX = target.x - 16
    const endY = target.y
    const c1x = startX + 200
    const c1y = startY + (endY - startY) * 0.6
    const c2x = endX - 40
    const c2y = endY + (startY - endY) * 0.2
    return `M ${startX} ${startY} C ${c1x} ${c1y} ${c2x} ${c2y} ${endX} ${endY}`
  }

  const renderFloatingStack = (
    center: { x: number; y: number },
    items: string[],
    color: string,
    labelMap: (id: string) => string,
  ) => {
    const max = 5
    const list = items.slice(-max)
    const startX = center.x + 18
    const startY = center.y + 22
    const step = 12
    return (
      <g>
        {list.map((id, i) => {
          const y = startY + i * step
          const text = labelMap(id)
          const w = Math.max(28, Math.min(160, text.length * 6.6))
          return (
            <g key={`${center.x}-${center.y}-${i}`} transform={`translate(${startX}, ${y})`}>
              <rect
                x={0}
                y={-8}
                rx={4}
                ry={4}
                width={w}
                height={16}
                fill="rgba(148,163,184,0.18)"
                stroke={color}
                strokeOpacity={0.45}
                strokeWidth={0.8}
              />
              <text
                x={6}
                y={4}
                fontSize="10"
                fill={color}
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
              >
                {text}
              </text>
            </g>
          )
        })}
      </g>
    )
  }

  return (
    <div
      className="w-full bg-gradient-to-r from-[hsl(220,15%,5%)] via-[hsl(220,20%,8%)] to-[hsl(220,15%,5%)] font-mono overflow-hidden relative rounded-xl border border-[hsl(330,100%,50%)]/20"
      style={{ height: `${containerHeight}px` }}  // <-- dynamic height removes bottom gap
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}  // matches dynamic canvas height
        className="w-full h-full"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="inactiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#374151" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#4B5563" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#374151" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="brainGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(220,15%,5%)" />
            <stop offset="50%" stopColor="hsl(285,75%,27%)" />
            <stop offset="100%" stopColor="hsl(330,100%,50%)" />
          </radialGradient>
          <linearGradient id="outputGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(220,15%,5%)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(285,75%,27%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(330,100%,50%)" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Input wires */}
        {sources.map((source) => {
          const wirePath = getSourceWirePath(source)
          return (
            <g key={`wire-${source.id}`}>
              <path
                d={wirePath}
                stroke={source.isActive ? source.color : "url(#inactiveGradient)"}
                strokeWidth={source.isActive ? 3 : 2}
                fill="none"
                opacity={source.isActive ? 0.9 : 0.4}
                filter={source.isActive ? "url(#glow)" : "none"}
              />
              {threatFlows
                .filter((flow) => flow.sourceId === source.id && flow.phase === "to-brain")
                .map((flow) => {
                  const progress = flow.progress / 100
                  return (
                    <circle key={flow.id} r={4} fill={flow.color} filter="url(#strongGlow)" opacity={0.9}>
                      <animateMotion
                        dur="3s"
                        begin="0s"
                        fill="freeze"
                        path={wirePath}
                        keyPoints={`${progress};${progress}`}
                        keyTimes="0;1"
                      />
                    </circle>
                  )
                })}
            </g>
          )
        })}

        {/* Output wires (right side unchanged) */}
        <path d={getOutputPath(truePositiveCenter)} stroke={outputWires.tp ? "url(#outputGradient)" : "url(#inactiveGradient)"} strokeWidth={outputWires.tp ? 4 : 2} fill="none" opacity={outputWires.tp ? 1 : 0.4} filter={outputWires.tp ? "url(#glow)" : "none"} />
        <path d={getOutputPath(falsePositiveCenter)} stroke={outputWires.fp ? "url(#outputGradient)" : "url(#inactiveGradient)"} strokeWidth={outputWires.fp ? 4 : 2} fill="none" opacity={outputWires.fp ? 1 : 0.4} filter={outputWires.fp ? "url(#glow)" : "none"} />
        <path d={getOutputPath(manualCenter)} stroke={outputWires.manual ? "url(#outputGradient)" : "url(#inactiveGradient)"} strokeWidth={outputWires.manual ? 4 : 2} fill="none" opacity={outputWires.manual ? 1 : 0.4} filter={outputWires.manual ? "url(#glow)" : "none"} />

        {/* Brain */}
        <g transform={`translate(${brainCenter.x}, ${brainCenter.y})`}>
          {Array.from({ length: 16 }).map((_, i) => {
            const base = (i * 22.5 * Math.PI) / 180
            const rot = base + (rotationAngle * Math.PI) / 180
            const z = Math.sin(rot * 2) * 0.7
            const radius = 50 + Math.sin(i * 0.8) * 5
            const x = Math.cos(rot) * radius * (1 + z * 0.3)
            const y = Math.sin(rot) * radius * (0.6 + z * 0.4)
            const scale = 1 + z * 0.5
            return <circle key={i} cx={x} cy={y} r={1.5 * scale} fill="hsl(330,100%,50%)" opacity={0.6 + z * 0.3} filter="url(#glow)" />
          })}
          <circle cx="0" cy="0" r="40" fill="url(#brainGradient)" stroke="hsl(330,100%,50%)" strokeWidth="2" filter="url(#strongGlow)" opacity="0.8" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * 45 * Math.PI) / 180
            return <line key={i} x1={Math.cos(a) * 15} y1={Math.sin(a) * 15} x2={Math.cos(a + Math.PI / 4) * 25} y2={Math.sin(a + Math.PI / 4) * 25} stroke="hsl(285,75%,27%)" strokeWidth="1" opacity="0.7" />
          })}
          {/* Central AI Core - Clickable */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] flex items-center justify-center glow-button z-10 cursor-pointer hover:scale-110 transition-all"
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 20px rgba(255,20,147,0.5)",
                "0 0 40px rgba(255,20,147,0.8)",
                "0 0 20px rgba(255,20,147,0.5)"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            onClick={() => setShowAgentPopup(true)}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className="w-12 h-12 text-white" />
          </motion.div>
        </g>

        {/* Sources panel */}
        <foreignObject x={leftPanelX} y={leftPanelY} width={leftPanelWidth} height={leftPanelHeight}>
          <div className="bg-slate-900/30 backdrop-blur-md rounded-lg p-3 border border-pink-500/30 shadow-xl w-[180px]">
            <h3 className="text-[11px] font-bold text-pink-200 mb-2 flex items-center gap-1">
              <div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse"></div>
              SOURCES
            </h3>
            <div className="space-y-1">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className={`relative flex items-center justify-between px-2 py-1 rounded text-[11px] transition-all duration-300 ${
                    source.isActive ? "bg-slate-800/40 border-l-2 shadow-lg" : "bg-slate-800/20 border border-slate-700/30"
                  }`}
                  style={{ borderLeftColor: source.isActive ? source.color : "transparent" }}
                >
                  <span className={`font-medium truncate ${source.isActive ? "text-white" : "text-slate-300"}`}>
                    {source.name}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${source.isActive ? "shadow-lg" : ""}`}
                    style={{
                      backgroundColor: source.isActive ? source.color : "#64748B",
                      boxShadow: source.isActive ? `0 0 8px ${source.color}` : "none",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </foreignObject>

        {/* Right headings (unchanged) */}
        <foreignObject x={tpHeadingX} y={tpHeadingY} width={headingBoxWidth} height={headingBoxHeight}>
          <div className="bg-slate-900/35 backdrop-blur-md rounded-md px-3 py-1 border border-red-500/30 shadow">
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <h3 className="text-[11px] font-bold text-red-300">TRUE+</h3>
            </div>
          </div>
        </foreignObject>
        <foreignObject x={fpHeadingX} y={fpHeadingY} width={headingBoxWidth} height={headingBoxHeight}>
          <div className="bg-slate-900/35 backdrop-blur-md rounded-md px-3 py-1 border border-yellow-500/30 shadow">
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <h3 className="text-[11px] font-bold text-yellow-300">FALSE+</h3>
            </div>
          </div>
        </foreignObject>
        <foreignObject x={manualHeadingX} y={manualHeadingY} width={headingBoxWidth} height={headingBoxHeight}>
          <div className="bg-slate-900/35 backdrop-blur-md rounded-md px-3 py-1 border border-blue-500/30 shadow">
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-[11px] font-bold text-blue-300">MANUAL</h3>
            </div>
          </div>
        </foreignObject>

        {/* Floating stacks (unchanged) */}
        {renderFloatingStack(truePositiveCenter, classificationStacks["true-positive"], "#fca5a5", id => sources.find(s => s.id === id)?.name ?? "???")}
        {renderFloatingStack(falsePositiveCenter, classificationStacks["false-positive"], "#fde68a", id => sources.find(s => s.id === id)?.name ?? "???")}
        {renderFloatingStack(manualCenter, classificationStacks["manual"], "#93c5fd", id => sources.find(s => s.id === id)?.name ?? "???")}

        {/* Bottom 4 info cards — just under the figure */}
        <foreignObject x={bottomCardsX} y={bottomCardsY} width={bottomCardsWidth} height={bottomCardsHeight}>
          <div className="flex items-stretch gap-3">
            <div className="bg-slate-900/30 backdrop-blur-md rounded p-3 border border-pink-500/30 shadow min-w-[120px]">
              <div className="text-sm font-bold text-cyan-300 leading-none">22</div>
              <div className="text-[11px] text-pink-200 mt-1 leading-none">Events</div>
              <div className="text-[11px] text-cyan-300 font-medium mt-1 leading-none">GB/24H</div>
            </div>
            <div className="bg-slate-900/30 backdrop-blur-md rounded p-3 border border-pink-500/30 shadow min-w-[120px]">
              <div className="text-sm font-bold text-green-300 leading-none">36</div>
              <div className="text-[11px] text-pink-200 mt-1 leading-none">Data</div>
              <div className="text-[11px] text-green-300 font-medium mt-1 leading-none">TB/24H</div>
            </div>
            <div className="bg-slate-900/30 backdrop-blur-md rounded p-3 border border-pink-500/30 shadow min-w-[120px]">
              <div className="text-sm font-bold text-orange-300 leading-none">12</div>
              <div className="text-[11px] text-pink-200 mt-1 leading-none">Open</div>
            </div>
            <div className="bg-slate-900/30 backdrop-blur-md rounded p-3 border border-pink-500/30 shadow min-w-[120px]">
              <div className="text-sm font-bold text-purple-300 leading-none">157K</div>
              <div className="text-[11px] text-pink-200 mt-1 leading-none">Prevented</div>
            </div>
          </div>
        </foreignObject>
      </svg>

      {/* Agent Analysis Popup Modal */}
      <AnimatePresence>
        {showAgentPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAgentPopup(false)}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-black/80 backdrop-blur-md border border-[hsl(330,100%,50%)]/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              style={{
                background: "linear-gradient(135deg, rgba(255,20,147,0.05) 0%, rgba(138,43,226,0.08) 50%, rgba(0,0,0,0.9) 100%)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] bg-clip-text text-transparent">
                  AI Agent Analysis Center
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAgentPopup(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Agent Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[hsl(330,100%,50%)]/10 border border-[hsl(330,100%,50%)]/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Agent Status</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{agentAnalysisData.status}</div>
                  <div className="text-xs text-gray-400">Confidence: {agentAnalysisData.confidence}%</div>
                </div>

                <div className="bg-[hsl(267,100%,67%)]/10 border border-[hsl(267,100%,67%)]/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Events Today</span>
                    <Activity className="w-4 h-4 text-[hsl(267,100%,67%)]" />
                  </div>
                  <div className="text-2xl font-bold text-[hsl(267,100%,67%)]">{agentAnalysisData.processedToday.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total: {agentAnalysisData.totalEvents}</div>
                </div>

                <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Threats Blocked</span>
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-400">{agentAnalysisData.threatsStopped}</div>
                  <div className="text-xs text-gray-400">FP Rate: {((agentAnalysisData.falsePositives / agentAnalysisData.threatsStopped) * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* AI Models Performance */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Brain className="w-5 h-5 text-[hsl(267,100%,67%)] mr-2" />
                  Active AI Models
                </h3>
                <div className="space-y-3">
                  {agentAnalysisData.models.map((model, index) => (
                    <div key={index} className="bg-[hsl(0,0%,8%)]/50 border border-[hsl(330,100%,50%)]/10 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{model.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          model.status === 'optimal' ? 'bg-green-400/10 text-green-400' :
                          model.status === 'active' ? 'bg-[hsl(330,100%,50%)]/10 text-[hsl(330,100%,50%)]' :
                          'bg-yellow-400/10 text-yellow-400'
                        }`}>
                          {model.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${model.accuracy}%` }}
                          />
                        </div>
                        <span className="text-xs text-[hsl(330,100%,50%)] font-medium">{model.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-[hsl(330,100%,50%)] mr-2" />
                  Recent Actions
                </h3>
                <div className="space-y-2">
                  {agentAnalysisData.recentActions.map((action, index) => (
                    <div key={index} className="bg-[hsl(0,0%,8%)]/50 border border-[hsl(330,100%,50%)]/10 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            action.type === 'Blocked' ? 'bg-red-400' :
                            action.type === 'Quarantined' ? 'bg-orange-400' :
                            'bg-blue-400'
                          }`} />
                          <div>
                            <span className={`text-sm font-medium ${
                              action.type === 'Blocked' ? 'text-red-400' :
                              action.type === 'Quarantined' ? 'text-orange-400' :
                              'text-blue-400'
                            }`}>
                              {action.type}
                            </span>
                            <p className="text-xs text-gray-300">{action.description}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{action.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gradient-to-r from-[hsl(330,100%,50%)]/10 to-[hsl(267,100%,67%)]/10 border border-[hsl(330,100%,50%)]/20 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[hsl(330,100%,50%)]">{agentAnalysisData.avgResponseTime}</div>
                    <div className="text-xs text-gray-400">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">99.2%</div>
                    <div className="text-xs text-gray-400">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[hsl(267,100%,67%)]">87%</div>
                    <div className="text-xs text-gray-400">Auto-resolved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">2.3ms</div>
                    <div className="text-xs text-gray-400">Latency</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}