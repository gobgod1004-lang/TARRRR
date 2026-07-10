import React from 'react';
import { BodySystem, SystemType } from '../types';
import { Heart, Activity, Brain, Wind } from 'lucide-react';

interface BodySystemSelectorProps {
  systems: BodySystem[];
  activeSystemId: SystemType;
  onSelectSystem: (id: SystemType) => void;
}

export default function BodySystemSelector({
  systems,
  activeSystemId,
  onSelectSystem,
}: BodySystemSelectorProps) {

  const getSystemIcon = (id: SystemType, color: string) => {
    switch (id) {
      case 'cardiovascular':
        return <Heart className={`w-5 h-5 ${color}`} />;
      case 'digestive':
        return <Activity className={`w-5 h-5 ${color}`} />;
      case 'respiratory':
        return <Wind className={`w-5 h-5 ${color}`} />;
      case 'nervous':
        return <Brain className={`w-5 h-5 ${color}`} />;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h2 className="font-mono text-xs font-bold text-slate-400 tracking-wider">
          TARGET BIO-REGION ROUTING
        </h2>
        <span className="text-[10px] font-mono text-slate-500 animate-pulse">
          SELECT Destination
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {systems.map((sys) => {
          const isActive = sys.id === activeSystemId;
          return (
            <button
              key={sys.id}
              onClick={() => onSelectSystem(sys.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group flex flex-col gap-2.5 ${
                isActive
                  ? 'bg-slate-900/90 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.01]'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              {/* Highlight bar inside card */}
              {isActive && (
                <div 
                  className="absolute top-0 left-0 right-0 h-1 transition-all duration-300" 
                  style={{ backgroundColor: sys.accentColor }}
                />
              )}

              <div className="flex justify-between items-center w-full">
                <span className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:scale-105 transition-transform duration-300">
                  {getSystemIcon(sys.id, isActive ? `text-[${sys.accentColor}]` : 'text-slate-400')}
                </span>
                <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
                  {sys.nameEn}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  {sys.name}
                  {isActive && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full animate-ping"
                      style={{ backgroundColor: sys.accentColor }}
                    />
                  )}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sys.description}
                </p>
              </div>

              {/* Specs footer inside card */}
              <div className="mt-1 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">
                  pH: <strong className="text-slate-300">{sys.surroundingPH}</strong>
                </span>
                <span className="text-slate-500">
                  TEMP: <strong className="text-slate-300">{sys.envTemperature}°C</strong>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
