
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Database, 
  Server, 
  Globe, 
  User, 
  FileText, 
  Network,
  Eye,
  Brain,
  Target,
  Zap,
  Activity,
  Lock,
  Unlock,
  HardDrive,
  Cpu,
  CloudLightning
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';

interface InvestigationNode {
  id: string;
  label: string;
  type: 'alert' | 'user' | 'asset' | 'process' | 'file' | 'network' | 'threat' | 'evidence' | 'timeline' | 'correlation';
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'info';
  x: number;
  y: number;
  z: number;
  connections: string[];
  questions: InvestigationQuestion[];
  isActive: boolean;
  isExpanded: boolean;
  depth: number;
  pulse: boolean;
  metadata: Record<string, any>;
  angle?: number;
  radius?: number;
  layer?: number;
}

interface InvestigationQuestion {
  id: string;
  text: string;
  answer?: string;
  followUp?: string[];
  confidence: number;
  category: 'behavioral' | 'technical' | 'temporal' | 'contextual';
  triggered: boolean;
}

interface Connection {
  from: string;
  to: string;
  strength: number;
  type: 'direct' | 'inferred' | 'temporal' | 'behavioral';
  confidence: number;
  animated: boolean;
  curvature?: number;
}

const nodeIcons = {
  alert: AlertTriangle,
  user: User,
  asset: Server,
  process: Cpu,
  file: FileText,
  network: Network,
  threat: Shield,
  evidence: Eye,
  timeline: Activity,
  correlation: Brain
};

// Golden spider web color scheme
const webColors = {
  primary: '#FFD700',      // Gold
  secondary: '#FFA500',    // Orange gold
  tertiary: '#FFFF99',     // Light gold
  accent: '#FF8C00',       // Dark orange
  glow: '#FFFF00'         // Bright yellow
};

const riskColors = {
  critical: '#FF4444',
  high: '#FF8800',
  medium: '#FFD700',
  low: '#90EE90',
  info: '#87CEEB'
};

import { useQuery } from "@tanstack/react-query";

function InvestigationKnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<InvestigationNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<InvestigationNode | null>(null);

  // Fetch real attack chain data from Neo4j
  const { data: attackChains } = useQuery({
    queryKey: ['/api/graph/attack-chains'],
    queryFn: () => fetch('/api/graph/attack-chains').then(res => res.json()),
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Fetch compromised assets
  const { data: compromisedAssets } = useQuery({
    queryKey: ['/api/graph/compromised-assets'],
    queryFn: () => fetch('/api/graph/compromised-assets').then(res => res.json()),
    refetchInterval: 5000,
  });
  const [activeQuestions, setActiveQuestions] = useState<InvestigationQuestion[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const centerX = 400;
  const centerY = 300;

  // Create spider web layout with real Neo4j data
  useEffect(() => {
    if (attackChains && attackChains.attackChains && attackChains.attackChains.length > 0) {
      // Use real attack chain data to create nodes
      const realChain = attackChains.attackChains[0];
      const centerNode: InvestigationNode = {
        id: realChain.id || 'alert-001',
        label: `Attack Chain - ${realChain.steps?.length || 0} steps`,
        type: 'alert',
        riskLevel: realChain.confidence > 0.8 ? 'critical' : 'high',
        x: centerX,
        y: centerY,
        z: 0,
        connections: realChain.steps?.map((_, i) => `step-${i}`) || [],
        questions: [
          {
            id: 'q1',
            text: 'What triggered this alert?',
          answer: 'Anomalous data exfiltration pattern detected',
          confidence: 94,
          category: 'technical',
          triggered: true,
          followUp: ['q2', 'q3']
        },
        {
          id: 'q2',
          text: 'Who is the affected user?',
          answer: 'john.doe@company.com',
          confidence: 98,
          category: 'contextual',
          triggered: true,
          followUp: ['q4']
        }
      ],
      isActive: true,
      isExpanded: false,
      depth: 0,
      pulse: true,
      metadata: { severity: 'critical', source: 'SIEM', timestamp: '2024-01-07T14:30:00Z' },
      angle: 0,
      radius: 0,
      layer: 0
    };

    // Create concentric layers like a spider web
    const layer1Nodes: InvestigationNode[] = [];
    const layer2Nodes: InvestigationNode[] = [];
    const layer3Nodes: InvestigationNode[] = [];

    // Layer 1 - Inner circle (6 nodes)
    const layer1Data = [
      { id: 'user-001', label: 'john.doe@company.com', type: 'user', risk: 'medium' },
      { id: 'asset-001', label: 'WORKSTATION-001', type: 'asset', risk: 'high' },
      { id: 'network-001', label: '192.168.1.105', type: 'network', risk: 'high' },
      { id: 'process-001', label: 'PowerShell.exe', type: 'process', risk: 'critical' },
      { id: 'threat-001', label: 'APT29 Indicators', type: 'threat', risk: 'critical' },
      { id: 'file-001', label: 'suspicious.ps1', type: 'file', risk: 'high' }
    ];

    layer1Data.forEach((nodeData, i) => {
      const angle = (i / layer1Data.length) * 2 * Math.PI;
      const radius = 120;
      layer1Nodes.push({
        id: nodeData.id,
        label: nodeData.label,
        type: nodeData.type as any,
        riskLevel: nodeData.risk as any,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        z: 0,
        connections: ['alert-001'],
        questions: [{
          id: `q${i + 3}`,
          text: `Investigate ${nodeData.type} details?`,
          confidence: 80 + Math.random() * 20,
          category: 'technical',
          triggered: false
        }],
        isActive: false,
        isExpanded: false,
        depth: 1,
        pulse: false,
        metadata: {},
        angle,
        radius,
        layer: 1
      });
    });

    // Layer 2 - Middle circle (12 nodes)
    const layer2Data = [
      { id: 'correlation-001', label: 'Related Events', type: 'correlation', risk: 'medium' },
      { id: 'evidence-001', label: 'Forensic Data', type: 'evidence', risk: 'high' },
      { id: 'timeline-001', label: 'Event Timeline', type: 'timeline', risk: 'medium' },
      { id: 'network-002', label: 'External IP', type: 'network', risk: 'critical' },
      { id: 'file-002', label: 'Registry Entry', type: 'file', risk: 'medium' },
      { id: 'process-002', label: 'Child Process', type: 'process', risk: 'high' },
      { id: 'user-002', label: 'Admin Account', type: 'user', risk: 'high' },
      { id: 'asset-002', label: 'Domain Controller', type: 'asset', risk: 'critical' },
      { id: 'threat-002', label: 'IOC Match', type: 'threat', risk: 'high' },
      { id: 'evidence-002', label: 'Memory Dump', type: 'evidence', risk: 'medium' },
      { id: 'correlation-002', label: 'Pattern Match', type: 'correlation', risk: 'low' },
      { id: 'timeline-002', label: 'Log Sequence', type: 'timeline', risk: 'medium' }
    ];

    layer2Data.forEach((nodeData, i) => {
      const angle = (i / layer2Data.length) * 2 * Math.PI;
      const radius = 220;
      layer2Nodes.push({
        id: nodeData.id,
        label: nodeData.label,
        type: nodeData.type as any,
        riskLevel: nodeData.risk as any,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        z: 0,
        connections: [],
        questions: [{
          id: `q${i + 10}`,
          text: `Analyze ${nodeData.type} connection?`,
          confidence: 70 + Math.random() * 30,
          category: 'contextual',
          triggered: false
        }],
        isActive: false,
        isExpanded: false,
        depth: 2,
        pulse: false,
        metadata: {},
        angle,
        radius,
        layer: 2
      });
    });

    // Layer 3 - Outer circle (18 nodes)
    const layer3Count = 18;
    for (let i = 0; i < layer3Count; i++) {
      const angle = (i / layer3Count) * 2 * Math.PI;
      const radius = 300;
      const types = ['network', 'file', 'process', 'evidence', 'correlation', 'timeline'];
      const type = types[i % types.length];
      
      layer3Nodes.push({
        id: `${type}-${Math.floor(i / types.length) + 3}`,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Math.floor(i / types.length) + 3}`,
        type: type as any,
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        z: 0,
        connections: [],
        questions: [],
        isActive: false,
        isExpanded: false,
        depth: 3,
        pulse: false,
        metadata: {},
        angle,
        radius,
        layer: 3
      });
    }

    const allNodes = [centerNode, ...layer1Nodes, ...layer2Nodes, ...layer3Nodes];
    
    // Create spider web connections
    const connectionList: Connection[] = [];
    
    // Center to layer 1 (main strands)
    layer1Nodes.forEach((node, i) => {
      connectionList.push({
        from: 'alert-001',
        to: node.id,
        strength: 0.9,
        type: 'direct',
        confidence: 95,
        animated: true,
        curvature: 0
      });
    });

    // Layer 1 to layer 2 (radial connections)
    layer1Nodes.forEach((node1, i) => {
      const nearbyLayer2 = layer2Nodes.filter((node2, j) => {
        const angleDiff = Math.abs(node1.angle! - node2.angle!);
        const minAngle = Math.min(angleDiff, 2 * Math.PI - angleDiff);
        return minAngle < Math.PI / 3; // Connect to nearby nodes
      });
      
      nearbyLayer2.forEach(node2 => {
        connectionList.push({
          from: node1.id,
          to: node2.id,
          strength: 0.6,
          type: 'inferred',
          confidence: 75,
          animated: false,
          curvature: 0.2
        });
      });
    });

    // Layer 2 to layer 3 (web strands)
    layer2Nodes.forEach((node2) => {
      const nearbyLayer3 = layer3Nodes.filter((node3) => {
        const angleDiff = Math.abs(node2.angle! - node3.angle!);
        const minAngle = Math.min(angleDiff, 2 * Math.PI - angleDiff);
        return minAngle < Math.PI / 4;
      });
      
      nearbyLayer3.slice(0, 2).forEach(node3 => {
        connectionList.push({
          from: node2.id,
          to: node3.id,
          strength: 0.4,
          type: 'temporal',
          confidence: 60,
          animated: false,
          curvature: 0.3
        });
      });
    });

    // Circular connections within layers (web rings)
    const createRingConnections = (layerNodes: InvestigationNode[], strength: number) => {
      layerNodes.forEach((node, i) => {
        const nextNode = layerNodes[(i + 1) % layerNodes.length];
        connectionList.push({
          from: node.id,
          to: nextNode.id,
          strength,
          type: 'behavioral',
          confidence: 50,
          animated: false,
          curvature: 0.1
        });
      });
    };

    createRingConnections(layer1Nodes, 0.5);
    createRingConnections(layer2Nodes, 0.3);
    createRingConnections(layer3Nodes, 0.2);

    setNodes(allNodes);
    setConnections(connectionList);
    setActiveQuestions(centerNode.questions);
  } else {
    // Fallback to demo data if no real data available
    const centerNode: InvestigationNode = {
      id: 'alert-001',
      label: 'Suspicious Network Activity',
      type: 'alert',
      riskLevel: 'critical',
      x: centerX,
      y: centerY,
      z: 0,
      connections: ['user-001', 'asset-001', 'network-001'],
      questions: [],
      isActive: true,
      isExpanded: false,
      depth: 0,
      pulse: true,
      metadata: { severity: 'critical', source: 'Demo', timestamp: new Date().toISOString() },
      angle: 0,
      radius: 0,
      layer: 0
    };
    setNodes([centerNode]);
    setConnections([]);
  }
  }, [rotation, attackChains, compromisedAssets]);

  // Gentle rotation animation
  useEffect(() => {
    if (!isRotating) return;
    
    const interval = setInterval(() => {
      setRotation(prev => prev + 0.2);
    }, 100);

    return () => clearInterval(interval);
  }, [isRotating]);

  const handleNodeClick = (node: InvestigationNode) => {
    setSelectedNode(node);
    setActiveQuestions(node.questions);
    
    // Highlight connected nodes
    setNodes(prev => prev.map(n => {
      if (node.connections.includes(n.id) || connections.some(c => 
        (c.from === node.id && c.to === n.id) || (c.from === n.id && c.to === node.id)
      )) {
        return { ...n, pulse: true };
      }
      return { ...n, pulse: n.id === node.id };
    }));
  };

  const renderConnections = () => {
    return connections.map((conn, index) => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (!fromNode || !toNode) return null;
      
      const strokeWidth = conn.strength * 2;
      const opacity = conn.strength * 0.8 + 0.2;
      
      // Create curved path for spider web effect
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      const curvature = conn.curvature || 0;
      const controlX = midX + curvature * 50;
      const controlY = midY + curvature * 50;
      
      const pathD = curvature > 0 
        ? `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY} ${toNode.x} ${toNode.y}`
        : `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
      
      return (
        <g key={`connection-${index}`}>
          {/* Glow effect */}
          <path
            d={pathD}
            stroke={webColors.glow}
            strokeWidth={strokeWidth + 2}
            opacity={opacity * 0.3}
            fill="none"
            filter="url(#glow)"
          />
          
          {/* Main connection */}
          <path
            d={pathD}
            stroke={webColors.primary}
            strokeWidth={strokeWidth}
            opacity={opacity}
            fill="none"
            strokeDasharray={conn.type === 'inferred' ? '3,3' : 'none'}
          />
          
          {/* Animated particles */}
          {conn.animated && (
            <circle r="1.5" fill={webColors.accent} opacity={0.8}>
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                path={pathD}
                rotate="auto"
              />
            </circle>
          )}
        </g>
      );
    });
  };

  const renderNodes = () => {
    return nodes.map((node) => {
      const IconComponent = nodeIcons[node.type];
      const riskColor = riskColors[node.riskLevel];
      
      const nodeSize = node.depth === 0 ? 20 : 
                     node.depth === 1 ? 15 : 
                     node.depth === 2 ? 12 : 8;
      
      return (
        <g
          key={node.id}
          transform={`translate(${node.x}, ${node.y}) rotate(${rotation})`}
          style={{ cursor: 'pointer' }}
          onClick={() => handleNodeClick(node)}
        >
          {/* Pulsing glow for active nodes */}
          {node.pulse && (
            <circle
              r={nodeSize + 15}
              fill={webColors.glow}
              opacity={0.1}
              className="animate-pulse"
            />
          )}
          
          {/* Outer glow ring */}
          <circle
            r={nodeSize + 5}
            fill={webColors.primary}
            opacity={0.2}
            filter="url(#glow)"
          />
          
          {/* Main node with gradient */}
          <circle
            r={nodeSize}
            fill={`url(#goldGradient)`}
            stroke={selectedNode?.id === node.id ? webColors.glow : riskColor}
            strokeWidth={selectedNode?.id === node.id ? 3 : 1.5}
            opacity={0.9}
            className="transition-all duration-300"
          />
          
          {/* Risk indicator ring */}
          <circle
            r={nodeSize - 2}
            fill="none"
            stroke={riskColor}
            strokeWidth={2}
            opacity={0.7}
          />
          
          {/* Node icon */}
          <foreignObject
            x={-nodeSize/2}
            y={-nodeSize/2}
            width={nodeSize}
            height={nodeSize}
          >
            <div className="w-full h-full flex items-center justify-center">
              <IconComponent 
                size={Math.max(6, nodeSize * 0.6)} 
                color="#000"
                style={{ opacity: 0.8 }}
              />
            </div>
          </foreignObject>
          
          {/* Node label */}
          {node.depth <= 1 && (
            <text
              y={nodeSize + 15}
              textAnchor="middle"
              fontSize={node.depth === 0 ? 12 : 10}
              fill={webColors.tertiary}
              className="font-mono font-medium"
              style={{ textShadow: '0 0 5px rgba(255, 215, 0, 0.5)' }}
            >
              {node.label}
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: webColors.primary, textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
          Investigation Spider Web
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRotating(!isRotating)}
            className="border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
          >
            {isRotating ? 'Pause' : 'Rotate'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spider Web Visualization */}
        <div className="lg:col-span-2">
          <Card className="bg-black/90 border-yellow-500/20 h-[600px] overflow-hidden">
            <CardContent className="p-0 h-full">
              <div className="relative w-full h-full">
                <svg
                  ref={svgRef}
                  className="w-full h-full"
                  viewBox="0 0 800 600"
                  style={{ background: 'radial-gradient(circle at center, rgba(0,0,0,0.9) 0%, black 100%)' }}
                >
                  <defs>
                    {/* Golden gradient for nodes */}
                    <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={webColors.tertiary} stopOpacity="1" />
                      <stop offset="50%" stopColor={webColors.primary} stopOpacity="0.8" />
                      <stop offset="100%" stopColor={webColors.secondary} stopOpacity="0.6" />
                    </radialGradient>
                    
                    {/* Glow filter */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>

                    {/* Web pattern */}
                    <pattern id="webPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                      <circle cx="30" cy="30" r="1" fill={webColors.primary} opacity="0.1"/>
                      <path d="M0,30 Q30,15 60,30 Q30,45 0,30" stroke={webColors.primary} strokeWidth="0.3" fill="none" opacity="0.05"/>
                    </pattern>
                  </defs>
                  
                  {/* Background web pattern */}
                  <rect width="100%" height="100%" fill="url(#webPattern)" />
                  
                  {/* Render connections (spider web strands) */}
                  <g filter="url(#glow)">
                    {renderConnections()}
                  </g>
                  
                  {/* Render nodes (intersection points) */}
                  <g>
                    {renderNodes()}
                  </g>
                  
                  {/* Center focal point glow */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r="50"
                    fill={webColors.glow}
                    opacity="0.05"
                    filter="url(#glow)"
                    className="animate-pulse"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investigation Panel */}
        <div className="space-y-4">
          {/* Selected Node Details */}
          {selectedNode && (
            <Card className="bg-black/80 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2" style={{ color: webColors.primary }}>
                  {React.createElement(nodeIcons[selectedNode.type], { size: 16, color: webColors.accent })}
                  <span>{selectedNode.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="ml-1 text-yellow-300 capitalize">{selectedNode.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Risk:</span>
                    <span className={`ml-1 capitalize`} style={{ color: riskColors[selectedNode.riskLevel] }}>
                      {selectedNode.riskLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Layer:</span>
                    <span className="ml-1 text-yellow-300">{selectedNode.layer || 0}</span>
                  </div>
                </div>
                
                {Object.entries(selectedNode.metadata).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="ml-1 text-gray-300">{String(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Investigation Questions */}
          <Card className="bg-black/80 border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: webColors.primary }}>Investigation Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeQuestions.length > 0 ? activeQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    question.triggered 
                      ? 'border-yellow-500/30 bg-yellow-500/5' 
                      : 'border-gray-700/30 bg-gray-800/30'
                  }`}
                >
                  <div className="text-sm font-medium text-yellow-200 mb-1">
                    {question.text}
                  </div>
                  {question.answer && (
                    <div className="text-xs text-gray-300 mb-2">
                      {question.answer}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      question.category === 'technical' ? 'bg-blue-400/20 text-blue-400' :
                      question.category === 'behavioral' ? 'bg-purple-400/20 text-purple-400' :
                      question.category === 'temporal' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-green-400/20 text-green-400'
                    }`}>
                      {question.category}
                    </span>
                    <span style={{ color: webColors.accent }}>
                      {question.confidence}% confidence
                    </span>
                  </div>
                </motion.div>
              )) : (
                <div className="text-sm text-gray-400 text-center py-4">
                  Select a node to view investigation questions
                </div>
              )}
            </CardContent>
          </Card>

          {/* Web Statistics */}
          <Card className="bg-black/80 border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: webColors.primary }}>Web Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Nodes:</span>
                  <span style={{ color: webColors.tertiary }}>{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Connections:</span>
                  <span style={{ color: webColors.tertiary }}>{connections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Web Layers:</span>
                  <span style={{ color: webColors.tertiary }}>4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Critical Alerts:</span>
                  <span className="text-red-400">{nodes.filter(n => n.riskLevel === 'critical').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { InvestigationKnowledgeGraph };
