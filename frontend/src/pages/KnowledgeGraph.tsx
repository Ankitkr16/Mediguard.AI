import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GitBranch, Activity, Info, AlertTriangle } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  group: number; // 0: Med, 1: Ing, 2: Disease, 3: SideEffect
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

export const KnowledgeGraph: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { largeText } = useTheme();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const containerRef = useRef<SVGSVGElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/knowledge-graph/explore');
      if (res.ok) {
        const data = await res.json();
        
        // Initialize node positions randomly around the center
        const width = 600;
        const height = 400;
        const initializedNodes = data.nodes.map((n: Node) => ({
          ...n,
          x: width / 2 + (Math.random() - 0.5) * 150,
          y: height / 2 + (Math.random() - 0.5) * 150,
          vx: 0,
          vy: 0
        }));

        setNodes(initializedNodes);
        setEdges(data.edges);
        
        if (initializedNodes.length > 0) {
          setSelectedNode(initializedNodes[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  // Force-directed simulation physics loop
  useEffect(() => {
    if (nodes.length === 0) return;

    const width = 600;
    const height = 400;
    const k = 120; // optimal distance
    const gravity = 0.05;
    const friction = 0.85;

    const tick = () => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) => ({ ...n }));

        // 1. Repulsion between all node pairs
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n1 = nextNodes[i];
            const n2 = nextNodes[j];
            const dx = (n1.x || 0) - (n2.x || 0);
            const dy = (n1.y || 0) - (n2.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1.0;

            if (dist < 220) {
              const force = (k * k) / dist;
              const fx = (dx / dist) * force * 0.08;
              const fy = (dy / dist) * force * 0.08;

              n1.vx = (n1.vx || 0) + fx;
              n1.vy = (n1.vy || 0) + fy;
              n2.vx = (n2.vx || 0) - fx;
              n2.vy = (n2.vy || 0) - fy;
            }
          }
        }

        // 2. Attraction along edges
        edges.forEach((edge) => {
          const sourceNode = nextNodes.find((n) => n.id === edge.source);
          const targetNode = nextNodes.find((n) => n.id === edge.target);

          if (sourceNode && targetNode) {
            const dx = (sourceNode.x || 0) - (targetNode.x || 0);
            const dy = (sourceNode.y || 0) - (targetNode.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1.0;

            const force = dist * 0.04;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            sourceNode.vx = (sourceNode.vx || 0) - fx;
            sourceNode.vy = (sourceNode.vy || 0) - fy;
            targetNode.vx = (targetNode.vx || 0) + fx;
            targetNode.vy = (targetNode.vy || 0) + fy;
          }
        });

        // 3. Update positions with velocity and gravity
        nextNodes.forEach((n) => {
          const dx = width / 2 - (n.x || 0);
          const dy = height / 2 - (n.y || 0);

          n.vx = ((n.vx || 0) + dx * gravity) * friction;
          n.vy = ((n.vy || 0) + dy * gravity) * friction;

          n.x = (n.x || 0) + n.vx;
          n.y = (n.y || 0) + n.vy;

          // Boundary constraints
          n.x = Math.max(30, Math.min(width - 30, n.x));
          n.y = Math.max(30, Math.min(height - 30, n.y));
        });

        return nextNodes;
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [edges.length]);

  const getNodeColor = (group: number) => {
    switch (group) {
      case 0: return '#ff5224'; // Medicine
      case 1: return '#0ea5e9'; // Ingredient
      case 2: return '#10b981'; // Disease / Treats
      case 3: return '#f59e0b'; // SideEffect
      default: return '#94a3b8';
    }
  };

  const getGroupName = (group: number) => {
    switch (group) {
      case 0: return 'Medicine';
      case 1: return 'Ingredient';
      case 2: return 'Indications';
      case 3: return 'Side Effect';
      default: return 'Concept';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Title Header */}
      <div className="p-6 premium-card bg-white border border-[#f1f5f9] flex items-center justify-between">
        <div>
          <h2 className={`font-extrabold text-slate-800 leading-tight ${largeText ? 'text-2xl' : 'text-lg'}`}>
            Medical Knowledge Graph
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Explore biochemical relationships, drug ingredients, indications, and side effects.
          </p>
        </div>
        <GitBranch className="text-[#ff5224]" size={24} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ff5224] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Left Panel: SVG Interactive Graph */}
          <div className="lg:col-span-2 premium-card bg-white border border-[#f1f5f9] flex flex-col justify-between min-h-[480px]">
            <div className="pt-4 px-6 border-b border-slate-100/50 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Interactive Relationship Map</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Drag to explore. Click nodes to inspect parameters.</p>
              </div>
              <div className="flex gap-4 text-[9px] text-slate-400 font-bold uppercase">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff5224]" /> Med</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0ea5e9]" /> Ingredient</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Treats</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Side Effect</span>
              </div>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center min-h-[400px]">
              <svg 
                ref={containerRef} 
                viewBox="0 0 600 400" 
                className="w-full h-full select-none"
              >
                {/* Connections (Edges) */}
                {edges.map((edge, idx) => {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;
                  
                  const isInteraction = edge.type.includes('INTERACTS');
                  
                  return (
                    <g key={idx}>
                      <line
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isInteraction ? '#ef4444' : '#cbd5e1'}
                        strokeWidth={isInteraction ? 1.5 : 0.75}
                        strokeDasharray={isInteraction ? '4 4' : 'none'}
                        opacity={isInteraction ? 0.8 : 0.4}
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const color = getNodeColor(node.group);
                  
                  return (
                    <g 
                      key={node.id}
                      transform={`translate(${node.x || 0}, ${node.y || 0})`}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(node)}
                    >
                      <circle
                        r={isSelected ? 10 : 7}
                        fill={color}
                        stroke="#fff"
                        strokeWidth={1.5}
                        className="transition-all duration-300"
                        style={{ filter: isSelected ? `drop-shadow(0 0 8px ${color})` : 'none' }}
                      />
                      <text
                        y={18}
                        textAnchor="middle"
                        fill="#1e293b"
                        fontSize={8}
                        fontWeight="bold"
                        className="pointer-events-none select-none bg-white font-sans"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right Panel: Selected Node Inspector */}
          <div className="p-6 premium-card bg-white border border-[#f1f5f9] flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold uppercase tracking-wider">
                    {getGroupName(selectedNode.group)} Node
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-lg mt-2">{selectedNode.label}</h3>
                </div>

                <div className="space-y-4 flex-grow pt-4">
                  <div className="flex gap-3 text-xs leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <Info className="text-slate-500 flex-shrink-0" size={16} />
                    <div>
                      <p className="font-bold text-slate-700">Relational Context</p>
                      <p className="text-slate-400 font-medium mt-1">
                        {selectedNode.group === 0 && `This is a primary medication in your prescription profile. It contains active ingredients mapped to clinical indications.`}
                        {selectedNode.group === 1 && `This is an active pharmaceutical ingredient (API). Cross-referencing duplicates flags risk matches if other medicines share this ingredient.`}
                        {selectedNode.group === 2 && `Clinical indication: This represents a diagnosed medical condition or disease treated by related medication nodes.`}
                        {selectedNode.group === 3 && `Reported physiological side-effect. Higher node degrees represent common symptom reactions.`}
                      </p>
                    </div>
                  </div>

                  {/* Node Relations Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Related Connections</h4>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                      {edges
                        .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                        .map((edge, idx) => {
                          const targetName = edge.source === selectedNode.id ? edge.target : edge.source;
                          const isWarning = edge.type.includes('INTERACTS');
                          return (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100/50 rounded-xl text-xs">
                              <span className="font-bold text-slate-700 truncate">{targetName}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                isWarning ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                              }`}>{edge.type}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Warning Alert Banner */}
                {edges.some(e => (e.source === selectedNode.id || e.target === selectedNode.id) && e.type.includes('INTERACTS')) && (
                  <div className="p-3 bg-red-50 border border-red-100/50 rounded-2xl flex items-start gap-2">
                    <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                    <p className="text-[10px] text-red-700 font-bold leading-normal">
                      Warning: Node belongs to an active drug interaction pair. Check safety checker for details.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-slate-400 font-semibold flex-1">
                <Activity size={32} className="text-slate-300 mb-2" />
                <p>Click on any graph node to inspect clinical context.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
