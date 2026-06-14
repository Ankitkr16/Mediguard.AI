import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const MedicalCore: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    {
      id: 'prefrontal',
      label: 'Prefrontal',
      sublabel: 'REASONING & REFLECTION',
      path: '/checker',
      x: 120,
      y: 90,
      textX: 30,
      textY: 80,
      align: 'right' as const,
    },
    {
      id: 'temporal',
      label: 'Temporal',
      sublabel: 'MEMORY & ASSOCIATION',
      path: '/reminders',
      x: 150,
      y: 180,
      textX: 30,
      textY: 220,
      align: 'right' as const,
    },
    {
      id: 'parietal',
      label: 'Parietal',
      sublabel: 'PERCEPTION & SENSORY',
      path: '/allergies',
      x: 270,
      y: 80,
      textX: 360,
      textY: 70,
      align: 'left' as const,
    },
    {
      id: 'subcortical',
      label: 'Subcortical',
      sublabel: 'ATTENTION & ROUTING',
      path: '/scanner',
      x: 240,
      y: 190,
      textX: 360,
      textY: 210,
      align: 'left' as const,
    },
  ];

  return (
    <div className="relative w-full max-w-3xl mx-auto py-8 px-4 flex flex-col items-center justify-center">
      {/* Background soft radial glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#ff5224]/3 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Main Container - Shifted slightly upwards */}
      <div className="relative w-full aspect-[16/9] flex items-center justify-center -translate-y-6">
        
        {/* Central 3D Glass Brain Image centerpiece - Enlarged */}
        <div className="absolute w-[420px] h-[260px] flex items-center justify-center pointer-events-none select-none z-0">
          <img 
            src="/glass_brain_core.png" 
            alt="Cognitive Safety Core" 
            className="w-full h-full object-contain mix-blend-multiply opacity-95 transition-opacity duration-500" 
          />
        </div>

        {/* Interactive Surrounding Labels */}
        {nodes.map((node) => {
          const isHovered = hoveredNode === node.id;
          return (
            <div
              key={node.id}
              onClick={() => navigate(node.path)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`absolute cursor-pointer transition-all duration-300 hidden md:block z-10 ${
                node.align === 'right' 
                  ? 'left-[4%] text-left items-start' 
                  : 'right-[4%] text-right items-end'
              }`}
              style={{ top: `${node.textY - 20}px` }}
            >
              <div className="flex flex-col">
                <span className={`text-[10px] tracking-widest font-extrabold transition-colors duration-200 uppercase ${
                  isHovered ? 'text-[#ff5224]' : 'text-slate-500'
                }`}>
                  {node.label}
                </span>
                <span className="text-[9px] tracking-wide text-slate-400 font-extrabold uppercase mt-0.5">
                  {node.sublabel}
                </span>
              </div>
            </div>
          );
        })}

        {/* Center SVG Brain Mesh & Guides */}
        <svg
          viewBox="0 0 400 280"
          className="w-full max-w-[530px] h-auto overflow-visible select-none z-10"
        >
          {/* Guide Lines from text to brain nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const textEndpointX = node.align === 'right' ? 80 : 320;
            return (
              <g key={`guide-${node.id}`} className="transition-opacity duration-300">
                {/* Connection line */}
                <line
                  x1={textEndpointX}
                  y1={node.textY}
                  x2={node.x}
                  y2={node.y}
                  stroke={isHovered ? '#ff5224' : '#cbd5e1'}
                  strokeWidth={isHovered ? '1.5' : '0.75'}
                  strokeDasharray={isHovered ? 'none' : '3 3'}
                  className="transition-all duration-300"
                />
                {/* Text Anchor dot */}
                <circle
                  cx={textEndpointX}
                  cy={node.textY}
                  r="2.5"
                  fill={isHovered ? '#ff5224' : '#94a3b8'}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}

          {/* Brain Base Graphic/Shadow */}
          <ellipse cx="200" cy="245" rx="75" ry="10" fill="rgba(0,0,0,0.02)" />

          {/* Interactive Core Nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            return (
              <g
                key={node.id}
                onClick={() => navigate(node.path)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer group"
              >
                {/* Glowing Outer Ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? '14' : '8'}
                  fill={isHovered ? 'rgba(255, 82, 36, 0.15)' : 'rgba(203, 213, 225, 0.3)'}
                  className="transition-all duration-300"
                />
                {/* Pulse Ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? '8' : '4.5'}
                  fill={isHovered ? 'rgba(255, 82, 36, 0.3)' : 'rgba(148, 163, 184, 0.15)'}
                  className="transition-all duration-300"
                />
                {/* Inner Core Dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="3.5"
                  fill={isHovered ? '#ff5224' : '#64748b'}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Console Status Info Box */}
      <div className="mt-2 flex flex-col items-center gap-2">
        {/* Pulse Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-[#f1f5f9] rounded-full shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5224] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff5224]"></span>
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Cognitive Safety Core Active
          </span>
        </div>
      </div>
    </div>
  );
};
