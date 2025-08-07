
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Filter, 
  Search,
  Network,
  Shield,
  AlertTriangle,
  User,
  Server,
  Globe,
  Cpu,
  Database,
  Lock,
  Eye,
  FileText,
  Activity
} from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  type: "user" | "asset" | "ip" | "process" | "file" | "vulnerability" | "threat" | "connection" | "domain" | "service";
  risk: "critical" | "high" | "medium" | "low";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  properties: Record<string, any>;
  connections: string[];
  isSelected: boolean;
  isHighlighted: boolean;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "communicates" | "executes" | "accesses" | "exploits" | "contains" | "originates" | "authenticates";
  weight: number;
  isActive: boolean;
  properties: Record<string, any>;
}

interface GraphForce {
  attraction: number;
  repulsion: number;
  damping: number;
}

const nodeIcons = {
  user: User,
  asset: Server,
  ip: Globe,
  process: Cpu,
  file: FileText,
  vulnerability: AlertTriangle,
  threat: Shield,
  connection: Network,
  domain: Globe,
  service: Database
};

const nodeColors = {
  critical: "#EF4444",
  high: "#F97316", 
  medium: "#EAB308",
  low: "#10B981"
};

const edgeColors = {
  communicates: "#3B82F6",
  executes: "#8B5CF6",
  accesses: "#10B981",
  exploits: "#EF4444",
  contains: "#F59E0B",
  originates: "#06B6D4",
  authenticates: "#84CC16"
};

export function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [forces, setForces] = useState<GraphForce>({
    attraction: 0.1,
    repulsion: 100,
    damping: 0.95
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("all");

  // Initialize sample cybersecurity graph data
  useEffect(() => {
    const sampleNodes: GraphNode[] = [
      {
        id: "user-1",
        label: "john.doe@company.com",
        type: "user",
        risk: "medium",
        x: 300,
        y: 200,
        vx: 0,
        vy: 0,
        radius: 25,
        properties: { department: "Finance", lastLogin: "2024-01-07 14:30" },
        connections: ["asset-1", "process-1"],
        isSelected: false,
        isHighlighted: false
      },
      {
        id: "asset-1",
        label: "WORKSTATION-001",
        type: "asset",
        risk: "high",
        x: 200,
        y: 150,
        vx: 0,
        vy: 0,
        radius: 30,
        properties: { os: "Windows 11", patch_level: "Critical patches missing" },
        connections: ["user-1", "ip-1", "vulnerability-1"],
        isSelected: false,
        isHighlighted: false
      },
      {
        id: "ip-1",
        label: "192.168.1.105",
        type: "ip",
        risk: "critical",
        x: 100,
        y: 200,
        vx: 0,
        vy: 0,
        radius: 20,
        properties: { geo_location: "Internal", reputation: "Clean" },
        connections: ["asset-1", "threat-1", "connection-1"],
        isSelected: false,
        isHighlighted: false
      },
      {
        id: "threat-1",
        label: "APT29 Campaign",
        type: "threat",
        risk: "critical",
        x: 50,
        y: 100,
        vx: 0,
        vy: 0,
        radius: 35,
        properties: { campaign: "SolarWinds-related", confidence: "High" },
        connections: ["ip-1", "vulnerability-1", "process-1"],
        isSelected: false,
        isHighlighted: false
      },
      {
        id: "process-1",
        label: "malware.exe",
        type: "process",
        risk: "critical",
        x: 400,
        y: 150,
        vx: 0,
        vy: 0,
        radius: 22,
        properties: { pid: "1337", command_line: "powershell.exe -enc <base64>" },
        connections: ["user-1", "threat-1", "file-1"],
        isSelected: false,
        isHighlighted: false
      },
      {
        id: "vulnerability-1",
        label: "CVE-2024-1234",
        type: "vulnerability",
        risk: "high",
        x: 150,
        y: 80,
        vx: 0,
        vy: 0,
        radius: 18,
        properties: { cvss_score: "8.9", description: "Remote code execution" },
        connections: ["asset-1", "threat-1"],
        isSelected: false,
        isHighlighted: false
      },
      {
        id: "file-1",
        label: "suspicious.dll",
        type: "file",
        risk: "high",
        x: 450,
        y: 250,
        vx: 0,
        vy: 0,
        radius: 16,
        properties: { hash: "a1b2c3d4...", size: "2.3MB" },
        connections: ["process-1"],
        isSelected: false,
        isHighlighted: false
      },
      {
        id: "connection-1",
        label: "C2 Channel",
        type: "connection",
        risk: "critical",
        x: 80,
        y: 300,
        vx: 0,
        vy: 0,
        radius: 20,
        properties: { protocol: "HTTPS", port: "443", encrypted: true },
        connections: ["ip-1", "domain-1"],
        isSelected: false,
        isHighlighted: false
      },
      {
        id: "domain-1",
        label: "evil-c2.com",
        type: "domain",
        risk: "critical",
        x: 180,
        y: 350,
        vx: 0,
        vy: 0,
        radius: 24,
        properties: { registrar: "Unknown", creation_date: "2024-01-01" },
        connections: ["connection-1"],
        isSelected: false,
        isHighlighted: false
      }
    ];

    const sampleEdges: GraphEdge[] = [
      {
        id: "edge-1",
        source: "user-1",
        target: "asset-1",
        type: "authenticates",
        weight: 1,
        isActive: true,
        properties: { login_time: "14:30", success: true }
      },
      {
        id: "edge-2",
        source: "asset-1",
        target: "ip-1",
        type: "communicates",
        weight: 2,
        isActive: true,
        properties: { bytes_transferred: "1.2GB", duration: "3m" }
      },
      {
        id: "edge-3",
        source: "ip-1",
        target: "threat-1",
        type: "originates",
        weight: 3,
        isActive: true,
        properties: { detection_time: "14:33", confidence: "95%" }
      },
      {
        id: "edge-4",
        source: "threat-1",
        target: "vulnerability-1",
        type: "exploits",
        weight: 3,
        isActive: true,
        properties: { exploit_kit: "Metasploit", success_rate: "87%" }
      },
      {
        id: "edge-5",
        source: "user-1",
        target: "process-1",
        type: "executes",
        weight: 2,
        isActive: true,
        properties: { execution_time: "14:35", elevated: false }
      },
      {
        id: "edge-6",
        source: "process-1",
        target: "file-1",
        type: "accesses",
        weight: 1,
        isActive: true,
        properties: { access_type: "write", timestamp: "14:36" }
      },
      {
        id: "edge-7",
        source: "ip-1",
        target: "connection-1",
        type: "communicates",
        weight: 2,
        isActive: true,
        properties: { protocol: "TLS 1.3", encrypted: true }
      },
      {
        id: "edge-8",
        source: "connection-1",
        target: "domain-1",
        type: "communicates",
        weight: 1,
        isActive: true,
        properties: { dns_resolution: "1.2.3.4", ttl: "300s" }
      }
    ];

    setNodes(sampleNodes);
    setEdges(sampleEdges);
  }, []);

  // Physics simulation
  const updateSimulation = useCallback(() => {
    if (!isSimulating) return;

    setNodes(currentNodes => {
      const newNodes = [...currentNodes];
      
      // Reset forces
      newNodes.forEach(node => {
        node.vx *= forces.damping;
        node.vy *= forces.damping;
      });

      // Repulsion between nodes
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          const node1 = newNodes[i];
          const node2 = newNodes[j];
          
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = forces.repulsion / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          node1.vx -= fx;
          node1.vy -= fy;
          node2.vx += fx;
          node2.vy += fy;
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const source = newNodes.find(n => n.id === edge.source);
        const target = newNodes.find(n => n.id === edge.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const optimalDistance = 100;
          
          const force = forces.attraction * (distance - optimalDistance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // Update positions
      newNodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        
        // Boundary constraints
        const margin = node.radius + 10;
        if (node.x < margin) { node.x = margin; node.vx = 0; }
        if (node.x > 580 - margin) { node.x = 580 - margin; node.vx = 0; }
        if (node.y < margin) { node.y = margin; node.vy = 0; }
        if (node.y > 380 - margin) { node.y = 380 - margin; node.vy = 0; }
      });

      return newNodes;
    });
  }, [isSimulating, forces, edges]);

  useEffect(() => {
    const interval = setInterval(updateSimulation, 50);
    return () => clearInterval(interval);
  }, [updateSimulation]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setNodes(nodes => 
      nodes.map(n => ({
        ...n,
        isSelected: n.id === node.id,
        isHighlighted: n.connections.includes(node.id) || n.id === node.id
      }))
    );
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setNodes(nodes => nodes.map(n => ({ ...n, isSelected: false, isHighlighted: false })));
  };

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = searchTerm === "" || 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = filterRisk === "all" || node.risk === filterRisk;
    
    return matchesSearch && matchesRisk;
  });

  const getNodeIcon = (type: string) => {
    const Icon = nodeIcons[type as keyof typeof nodeIcons] || Network;
    return Icon;
  };

  return (
    <div className="w-full h-full bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl">
      {/* Controls Header */}
      <div className="p-4 border-b border-[hsl(330,100%,50%)]/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-[hsl(330,100%,50%)]" />
            <h3 className="text-lg font-semibold text-white">Deep Knowledge Graph</h3>
            <Badge variant="outline" className="border-[hsl(267,100%,67%)]/20 text-[hsl(267,100%,67%)]">
              Neo4j Style
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSimulating(!isSimulating)}
              className={`${isSimulating ? 'text-green-400' : 'text-gray-400'}`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleZoom(0.1)}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleZoom(-0.1)}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[hsl(330,100%,50%)]/40"
            />
          </div>
          
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-3 py-2 bg-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-lg text-white focus:outline-none focus:border-[hsl(330,100%,50%)]/40"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="flex h-[600px]">
        {/* Graph Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox={`${-pan.x} ${-pan.y} ${600 / zoom} ${400 / zoom}`}
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#64748B"
                />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map(edge => {
              const source = filteredNodes.find(n => n.id === edge.source);
              const target = filteredNodes.find(n => n.id === edge.target);
              
              if (!source || !target) return null;

              const isHighlighted = source.isHighlighted && target.isHighlighted;
              
              return (
                <g key={edge.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? edgeColors[edge.type] : "#374151"}
                    strokeWidth={isHighlighted ? edge.weight + 1 : 1}
                    opacity={isHighlighted ? 0.8 : 0.4}
                    filter={isHighlighted ? "url(#edge-glow)" : "none"}
                    markerEnd="url(#arrowhead)"
                  />
                  {isHighlighted && (
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2 - 5}
                      textAnchor="middle"
                      className="fill-white text-xs font-medium"
                      filter="url(#glow)"
                    >
                      {edge.type}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map(node => {
              const Icon = getNodeIcon(node.type);
              
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={nodeColors[node.risk]}
                    stroke={node.isSelected ? "#FFFFFF" : nodeColors[node.risk]}
                    strokeWidth={node.isSelected ? 3 : 1}
                    opacity={node.isHighlighted || !selectedNode ? 0.9 : 0.3}
                    filter={node.isSelected || node.isHighlighted ? "url(#glow)" : "none"}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => handleNodeClick(node)}
                  />
                  
                  {/* Node Icon */}
                  <foreignObject
                    x={node.x - 8}
                    y={node.y - 8}
                    width="16"
                    height="16"
                    className="pointer-events-none"
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </foreignObject>
                  
                  {/* Node Label */}
                  <text
                    x={node.x}
                    y={node.y + node.radius + 15}
                    textAnchor="middle"
                    className="fill-white text-xs font-medium pointer-events-none"
                    opacity={node.isHighlighted || !selectedNode ? 1 : 0.5}
                  >
                    {node.label.length > 15 ? node.label.substring(0, 15) + "..." : node.label}
                  </text>

                  {/* Risk Badge */}
                  {(node.isSelected || node.isHighlighted) && (
                    <rect
                      x={node.x + node.radius - 5}
                      y={node.y - node.radius - 5}
                      width="20"
                      height="12"
                      rx="6"
                      fill={nodeColors[node.risk]}
                      opacity="0.9"
                    />
                  )}
                  {(node.isSelected || node.isHighlighted) && (
                    <text
                      x={node.x + node.radius + 5}
                      y={node.y - node.radius + 2}
                      textAnchor="middle"
                      className="fill-white text-xs font-bold"
                    >
                      {node.risk.charAt(0).toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Graph Stats Overlay */}
          <div className="absolute top-4 left-4 bg-[hsl(0,0%,10%)]/80 backdrop-blur-sm rounded-lg p-3 border border-[hsl(330,100%,50%)]/20">
            <div className="text-xs text-gray-400 space-y-1">
              <div>Nodes: <span className="text-white font-medium">{filteredNodes.length}</span></div>
              <div>Edges: <span className="text-white font-medium">{edges.length}</span></div>
              <div>Zoom: <span className="text-white font-medium">{(zoom * 100).toFixed(0)}%</span></div>
            </div>
          </div>
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 border-l border-[hsl(330,100%,50%)]/20 bg-[hsl(0,0%,6%)]/60 p-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Node Details</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const Icon = getNodeIcon(selectedNode.type);
                  return <Icon className="w-8 h-8 text-[hsl(330,100%,50%)]" />;
                })()}
                <div>
                  <div className="text-white font-medium">{selectedNode.label}</div>
                  <div className="text-sm text-gray-400 capitalize">{selectedNode.type}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge className={`${
                  selectedNode.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
                  selectedNode.risk === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  selectedNode.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {selectedNode.risk.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                  {selectedNode.connections.length} connections
                </Badge>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Properties</h5>
                <div className="space-y-2">
                  {Object.entries(selectedNode.properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                      <span className="text-white">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Connected Nodes</h5>
                <div className="space-y-1">
                  {selectedNode.connections.map(connId => {
                    const connectedNode = nodes.find(n => n.id === connId);
                    if (!connectedNode) return null;
                    
                    return (
                      <div
                        key={connId}
                        className="text-sm text-gray-300 hover:text-white cursor-pointer p-2 rounded bg-[hsl(0,0%,10%)]/40 hover:bg-[hsl(0,0%,10%)]/60 transition-colors"
                        onClick={() => handleNodeClick(connectedNode)}
                      >
                        {connectedNode.label}
                        <span className="text-xs text-gray-500 ml-2">({connectedNode.type})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-[hsl(330,100%,50%)]/20 bg-[hsl(0,0%,6%)]/40">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h6 className="text-sm font-medium text-gray-300 mb-2">Risk Levels</h6>
            <div className="flex space-x-3">
              {Object.entries(nodeColors).map(([risk, color]) => (
                <div key={risk} className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-xs text-gray-400 capitalize">{risk}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h6 className="text-sm font-medium text-gray-300 mb-2">Relationships</h6>
            <div className="flex flex-wrap gap-2">
              {Object.entries(edgeColors).slice(0, 4).map(([type, color]) => (
                <div key={type} className="flex items-center space-x-1">
                  <div className="w-3 h-0.5" style={{ backgroundColor: color }}></div>
                  <span className="text-xs text-gray-400">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
