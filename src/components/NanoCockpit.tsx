import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Activity, Flame, Shield, Compass, Sparkles, 
  RefreshCw, Play, Pause, AlertTriangle, HelpCircle, ArrowRightLeft, Database,
  Skull, Trash2, ShieldAlert
} from 'lucide-react';
import { BodySystem, ChatMessage, ScanTarget } from '../types';

interface NanoCockpitProps {
  system: BodySystem;
  speed: number;
  setSpeed: (s: number) => void;
  viewMode: 'autopilot' | 'manual';
  setViewMode: (m: 'autopilot' | 'manual') => void;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeTarget: ScanTarget | null;
  setActiveTarget: (t: ScanTarget | null) => void;
  isScanning: boolean;
  setIsScanning: (b: boolean) => void;
  onManualSteer: () => void;
  contaminationLevel: number;
  setContaminationLevel: React.Dispatch<React.SetStateAction<number>>;
}

export default function NanoCockpit({
  system,
  speed,
  setSpeed,
  viewMode,
  setViewMode,
  chatHistory,
  setChatHistory,
  activeTarget,
  setActiveTarget,
  isScanning,
  setIsScanning,
  contaminationLevel,
  setContaminationLevel,
}: NanoCockpitProps) {
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [coreStatus, setCoreStatus] = useState({
    hullIntegrity: 100,
    energyLevel: 100,
    scanningSync: 100,
    shieldActive: true,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat terminal
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Jitter hull and energy slightly for realistic sci-fi cockpit feel
  useEffect(() => {
    const interval = setInterval(() => {
      setCoreStatus(prev => {
        const jitterEnergy = Math.random() > 0.7 ? -0.1 : 0;
        return {
          ...prev,
          energyLevel: Math.max(40, Math.min(100, +(prev.energyLevel + jitterEnergy).toFixed(1))),
          hullIntegrity: prev.hullIntegrity,
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 🧪 Dynamics of Bio-Contamination System
  const getContaminationTheme = () => {
    if (contaminationLevel < 20) return {
      border: 'border-slate-800',
      bg: 'bg-slate-900/60',
      glow: 'shadow-cyan-500/10',
      indicator: 'text-cyan-400',
      accent: 'bg-cyan-500',
      text: 'text-cyan-400',
      barBg: 'bg-cyan-500',
      name: '도움이 되는 동료 나노 의사',
    };
    if (contaminationLevel < 50) return {
      border: 'border-yellow-900/40',
      bg: 'bg-slate-900/70',
      glow: 'shadow-yellow-500/15',
      indicator: 'text-yellow-400',
      accent: 'bg-yellow-500',
      text: 'text-yellow-400',
      barBg: 'bg-yellow-500/80',
      name: '지터를 느끼는 노이즈 나노',
    };
    if (contaminationLevel < 80) return {
      border: 'border-rose-950/60',
      bg: 'bg-slate-950/80',
      glow: 'shadow-rose-500/20',
      indicator: 'text-rose-500 animate-pulse',
      accent: 'bg-rose-600',
      text: 'text-rose-400',
      barBg: 'bg-rose-600',
      name: '타락한 생체 침식 제어자',
    };
    return {
      border: 'border-purple-950/90',
      bg: 'bg-purple-950/15',
      glow: 'shadow-purple-500/30',
      indicator: 'text-purple-400 animate-bounce',
      accent: 'bg-purple-600',
      text: 'text-purple-400',
      barBg: 'bg-purple-600',
      name: '나노 도미네이터 (Corrupt)',
    };
  };

  const injectToxin = (type: 'tar' | 'alcohol' | 'virus' | 'plastic') => {
    let increase = 15;
    let name = '';
    let description = '';
    let logIcon = '☣️';

    if (type === 'tar') {
      name = '액상 타르 대용량 주입';
      description = '끈적한 유독 타르 점액질이 모세혈관 벽과 섬모에 부착되기 시작했습니다. 산소 수취 헤모글로빈이 산화되고 있습니다.';
      increase = 15;
    } else if (type === 'alcohol') {
      name = '초정밀 아세트알데히드 기화 살포';
      description = '알코올성 독소 아세트알데히드가 주입되어 간장 장벽 세포벽의 수용체들을 용해하며 통제 능력이 훼손됩니다.';
      increase = 15;
    } else if (type === 'virus') {
      name = '돌기성 나노 면역 변이 패소젠';
      description = '면역 시스템에 위장 무력화 코드를 이식하는 가시 바이러스를 방출합니다. 대식세포와 전신 융털이 부식되기 시작합니다.';
      increase = 20;
      logIcon = '👾';
    } else if (type === 'plastic') {
      name = '초미세 나노플라스틱 톱날 파편';
      description = '칼날처럼 날카로운 초미세 나노플라스틱 잔해가 혈액 및 신경초막을 꿰찌르며 통신선과 신경 마디의 전류 단선을 유발합니다.';
      increase = 15;
      logIcon = '💎';
    }

    const nextVal = Math.min(100, contaminationLevel + increase);
    setContaminationLevel(nextVal);

    // Inflict slight vehicle stress
    setCoreStatus(prev => ({
      ...prev,
      hullIntegrity: Math.max(30, prev.hullIntegrity - 5),
      energyLevel: Math.max(25, prev.energyLevel - 3),
    }));

    const alarmMsg: ChatMessage = {
      id: `toxin-inject-${Date.now()}`,
      sender: 'system',
      text: `${logIcon} [생체 파괴 프로토콜] ${name} (${increase}%) 주입 실행!\n────────────────────\n${description}\n\n⚠️ 생체 위해 경보: 인체 전체 오염률이 [ ${nextVal}% ]로 폭증하였습니다. 내부 세포 구조의 대규모 오염 및 괴사가 관찰됩니다.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory(prev => [...prev, alarmMsg]);
  };

  // Preset suggested questions for quick-click learning depending on system
  const getSuggestedPrompts = () => {
    switch (system.id) {
      case 'cardiovascular':
        return [
          '이 혈관 벽에 낀 노란색 기름때는 뭔가요?',
          '적혈구와 백혈구의 기능 차이를 알려줘.',
          '나노 탐사선이 혈전(피떡)에 부딪히면 어떻게 되죠?',
        ];
      case 'digestive':
        return [
          '지금 위장 안의 액체는 왜 이렇게 부식성이 강한가요?',
          '저기 보이는 미세한 주름들은 무엇을 흡수하나요?',
          '유산균은 우리 몸에서 어떤 좋은 일을 하나요?',
        ];
      case 'respiratory':
        return [
          '산소 분자가 적혈구에 결합하는 원리가 무엇인가요?',
          '기관지 섬모들이 왜 계속 쓸어 올리는 운동을 하나요?',
          '폐에 초미세먼지가 가득 차면 폐포는 어떻게 되나요?',
        ];
      case 'nervous':
        return [
          '번쩍이는 저 전기 신호(활동전위)의 속도는 얼마나 빠른가요?',
          '시냅스 틈새에서 신경전달물질은 어떻게 신호를 전하나요?',
          '수초(Myelin sheath) 보호막이 벗겨지면 어떤 질병이 생기나요?',
        ];
    }
  };

  // Trigger Gemini AI Chat API
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory(prev => [...prev, userMsg]);
    setUserInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          systemType: system.id,
          history: chatHistory.filter(c => c.sender !== 'system'),
          contaminationLevel: contaminationLevel,
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `chat-ai-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: `chat-err-${Date.now()}`,
        sender: 'system',
        text: '⚠️ 생체 원격 통신망 연결이 원활하지 않습니다. AI 보조 컴퓨터를 로컬 비상 모드로 전환합니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Trigger Scanner Scan Report via Gemini
  const triggerScan = async (target: ScanTarget) => {
    if (isScanning) return;
    setIsScanning(true);
    setActiveTarget({ ...target, scanned: true });

    // Instantly append a system "Scanning..." message
    const scanStartMsg: ChatMessage = {
      id: `scan-start-${Date.now()}`,
      sender: 'system',
      text: `📡 표적 분광기 락온: [${target.name}] 정밀 스캔 중...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory(prev => [...prev, scanStartMsg]);

    try {
      const response = await fetch('/api/gemini/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: target.id,
          targetName: target.name,
          systemType: system.name,
          contaminationLevel: contaminationLevel,
        }),
      });

      if (!response.ok) throw new Error('Scan failed');

      const data = await response.json();

      // Update cockpit stats for successful scan
      setCoreStatus(prev => ({ ...prev, scanningSync: Math.min(100, prev.scanningSync + 5) }));

      const scanResultMsg: ChatMessage = {
        id: `scan-result-${Date.now()}`,
        sender: 'assistant',
        text: data.analysis,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scanData: {
          targetName: target.name,
          systemName: system.name,
          analysis: data.analysis,
        },
      };

      setChatHistory(prev => [...prev, scanResultMsg]);
    } catch (err) {
      console.error(err);
      const scanFailMsg: ChatMessage = {
        id: `scan-fail-${Date.now()}`,
        sender: 'system',
        text: `⚠️ 스캔 실패: 주변 장벽 주파수 간섭이 심합니다. [${target.name}]의 고유 진동 분광을 원격 해독할 수 없습니다.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory(prev => [...prev, scanFailMsg]);
    } finally {
      setIsScanning(false);
    }
  };

  // Trigger scan when active target is updated from canvas
  useEffect(() => {
    if (activeTarget && !activeTarget.scanned) {
      triggerScan(activeTarget);
    }
  }, [activeTarget]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* 1. Left Sidebar Panel: Navigation Steering & Nano Vessel Stats (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Navigation control cluster */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
          <div className="flex justify-between items-center">
            <h3 className="font-mono text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              PILOTING INTERFACE
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 border border-slate-700 text-cyan-400 rounded">
              {viewMode.toUpperCase()}
            </span>
          </div>

          {/* Autopilot toggle */}
          <div className="flex gap-2.5">
            <button
              onClick={() => setViewMode('autopilot')}
              className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                viewMode === 'autopilot'
                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              AUTOPILOT
            </button>
            <button
              onClick={() => setViewMode('manual')}
              className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                viewMode === 'manual'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Pause className="w-3.5 h-3.5" />
              MANUAL (WASD)
            </button>
          </div>

          {/* Speed slider */}
          <div className="flex flex-col gap-2 bg-slate-950/40 border border-slate-800/60 p-3 rounded-lg">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">탐사선 추진력 레벨</span>
              <span className="text-cyan-400 font-bold">{speed}0% POWER</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>미세 관찰 (정밀)</span>
              <span>최고 가속 (순항)</span>
            </div>
          </div>

          {/* Vessel condition gauges */}
          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="flex justify-between items-center text-[10px] text-slate-500 pb-1 border-b border-slate-800">
              <span>VEHICLE TELEMETRY</span>
              <span className="text-emerald-400">● SYSTEM NOMINAL</span>
            </div>

            {/* Hull integrity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  선체 격막 내구도 (Shield)
                </span>
                <span className="text-emerald-400 font-bold">{coreStatus.hullIntegrity}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${coreStatus.hullIntegrity}%` }} />
              </div>
            </div>

            {/* Battery / Energy */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  나노 열원 융합로 배터리
                </span>
                <span className="text-amber-400 font-bold">{coreStatus.energyLevel}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${coreStatus.energyLevel}%` }} />
              </div>
            </div>

            {/* Scan Sync database */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  바이오 분석 전송 동기화
                </span>
                <span className="text-cyan-400 font-bold">{coreStatus.scanningSync}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${coreStatus.scanningSync}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic environmental bio-sensor module */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <h3 className="font-mono text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            ORGAN ENVIRONMENT SENSOR
          </h3>
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg flex flex-col">
              <span className="text-[10px] font-mono text-slate-500">주변 수소이온지수</span>
              <span className="text-sm font-mono font-bold text-slate-200 mt-1 flex items-baseline gap-1">
                {system.surroundingPH}
                <span className="text-[10px] text-slate-500 font-normal">pH</span>
              </span>
              <div className="text-[9px] text-slate-400 mt-1 font-sans">
                {parseFloat(system.surroundingPH) < 4 ? '⚠️ 위산 자극 극심' : '안정적 중성 유기액'}
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg flex flex-col">
              <span className="text-[10px] font-mono text-slate-500">생체 조직 온도</span>
              <span className="text-sm font-mono font-bold text-slate-200 mt-1 flex items-baseline gap-1">
                {system.envTemperature}
                <span className="text-[10px] text-slate-500 font-normal">°C</span>
              </span>
              <div className="text-[9px] text-slate-400 mt-1 font-sans">
                {parseFloat(system.envTemperature) < 36 ? '기관지 외부 기류 유입' : '정상 온혈 생체'}
              </div>
            </div>
          </div>
        </div>

        {/* 🧪 Bio-Contamination Injector Panel */}
        <div className={`bg-slate-900/60 backdrop-blur border ${getContaminationTheme().border} rounded-xl p-4 flex flex-col gap-3.5 shadow-lg relative overflow-hidden transition-all duration-300`}>
          <div className={`absolute top-0 left-0 w-1.5 h-full ${getContaminationTheme().accent}`} />
          <div className="flex justify-between items-center">
            <h3 className="font-mono text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Skull className={`w-4 h-4 ${getContaminationTheme().text}`} />
              BIO-CONTAMINATION CORE
            </h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${contaminationLevel > 50 ? 'bg-red-950/40 border-red-850 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              {contaminationLevel}% INTRUSION
            </span>
          </div>

          {/* Contamination Progress Gauge */}
          <div className="flex flex-col gap-1.5 font-mono">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">인체 오염 및 세포 괴사율</span>
              <span className={`font-bold ${getContaminationTheme().indicator}`}>{contaminationLevel}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
              <div 
                className={`h-full ${getContaminationTheme().barBg} rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]`} 
                style={{ width: `${contaminationLevel}%` }} 
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 leading-none mt-0.5">
              <span>NOMINAL (정상)</span>
              <span>DOMINATED (괴사)</span>
            </div>
          </div>

          {/* Injector Button Grid */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">발포 가능한 생체 극약 오염원</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => injectToxin('tar')}
                disabled={contaminationLevel >= 100}
                className="py-1.5 px-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-left rounded-lg transition-all flex flex-col gap-0.5 disabled:opacity-40 cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  타르 점액
                </span>
                <span className="text-[8px] font-sans text-slate-500 leading-tight">니코틴 섬모 마비 (+15%)</span>
              </button>

              <button
                onClick={() => injectToxin('alcohol')}
                disabled={contaminationLevel >= 100}
                className="py-1.5 px-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-left rounded-lg transition-all flex flex-col gap-0.5 disabled:opacity-40 cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  아세트알데히드
                </span>
                <span className="text-[8px] font-sans text-slate-500 leading-tight">소화 위벽 세포 녹임 (+15%)</span>
              </button>

              <button
                onClick={() => injectToxin('virus')}
                disabled={contaminationLevel >= 100}
                className="py-1.5 px-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-left rounded-lg transition-all flex flex-col gap-0.5 disabled:opacity-40 cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-fuchsia-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
                  변이 패소젠
                </span>
                <span className="text-[8px] font-sans text-slate-500 leading-tight">면역 무력화 바이러스 (+20%)</span>
              </button>

              <button
                onClick={() => injectToxin('plastic')}
                disabled={contaminationLevel >= 100}
                className="py-1.5 px-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-left rounded-lg transition-all flex flex-col gap-0.5 disabled:opacity-40 cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  나노 플라스틱
                </span>
                <span className="text-[8px] font-sans text-slate-500 leading-tight">신경절 피복 단선 (+15%)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Right Panel: Dynamic AI Assistant Terminal Log & Scanner Report (8 cols) */}
      <div className={`lg:col-span-8 flex flex-col bg-slate-900/60 backdrop-blur border ${getContaminationTheme().border} rounded-xl shadow-xl overflow-hidden min-h-[460px] max-h-[560px] transition-all duration-300`}>
        {/* Terminal Header */}
        <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${contaminationLevel > 50 ? 'bg-red-500 animate-ping' : 'bg-rose-500 animate-pulse'}`} />
            <span className={`text-xs font-mono font-bold tracking-wider flex items-center gap-1.5 ${getContaminationTheme().text}`}>
              {contaminationLevel > 80 ? <Skull className="w-4 h-4 text-purple-400 animate-bounce" /> : <Bot className="w-4 h-4 text-rose-400" />}
              NANO-ROVER AI CORE: {getContaminationTheme().name}
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-500">
            {contaminationLevel > 80 ? '☢️ PROTOCOL_CORRUPTED_V100' : 'SECURE BI-COMM_V2.5'}
          </span>
        </div>

        {/* Messages Terminal View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs leading-relaxed custom-scrollbar bg-slate-950/40">
          {chatHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';
            const isAssistant = msg.sender === 'assistant';

            // Determine specific background styles based on contamination
            let bubbleStyle = 'bg-rose-500/5 border-rose-500/10 rounded-tl-none';
            let profileStyle = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
            let iconElement = <Bot className="w-4 h-4" />;

            if (isUser) {
              bubbleStyle = 'bg-amber-500/5 border-amber-500/20 rounded-tr-none';
              profileStyle = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
              iconElement = <User className="w-4 h-4" />;
            } else if (isSystem) {
              bubbleStyle = 'bg-cyan-950/20 border-cyan-500/10 rounded-tl-none font-bold text-cyan-400';
              profileStyle = 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
              iconElement = <ArrowRightLeft className="w-4 h-4" />;
              
              if (msg.text.includes('[생체 파괴 프로토콜]')) {
                bubbleStyle = 'bg-red-950/40 border-red-950 text-red-400 rounded-tl-none border-l-4 border-l-red-500 font-bold';
                profileStyle = 'bg-red-500/20 border-red-500 text-red-500';
                iconElement = <Skull className="w-4 h-4 animate-bounce" />;
              }
            } else if (isAssistant) {
              if (contaminationLevel >= 80) {
                bubbleStyle = 'bg-purple-950/30 border-purple-900/60 text-purple-200 rounded-tl-none shadow-[inset_0_0_10px_rgba(147,51,234,0.1)]';
                profileStyle = 'bg-purple-950 border-purple-500 text-purple-400';
                iconElement = <Skull className="w-4 h-4" />;
              } else if (contaminationLevel >= 50) {
                bubbleStyle = 'bg-rose-950/20 border-rose-900/40 text-rose-200 rounded-tl-none';
                profileStyle = 'bg-rose-950 border-rose-500 text-rose-400';
                iconElement = <ShieldAlert className="w-4 h-4 animate-pulse" />;
              } else if (contaminationLevel >= 20) {
                bubbleStyle = 'bg-yellow-950/10 border-yellow-800/20 text-yellow-100 rounded-tl-none';
                profileStyle = 'bg-yellow-900/20 border-yellow-700/40 text-yellow-400';
              }
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Profile Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${profileStyle}`}>
                  {iconElement}
                </div>

                {/* Message Box */}
                <div className="flex flex-col gap-1">
                  <div className={`rounded-xl p-3 border text-slate-100 ${bubbleStyle}`}>
                    {/* If message is a scan report, format beautifully */}
                    {msg.scanData ? (
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 font-bold border-b pb-1.5 ${
                          contaminationLevel >= 80 ? 'text-purple-400 border-purple-500/20' : 'text-rose-400 border-rose-500/20'
                        }`}>
                          {contaminationLevel >= 80 ? <Skull className="w-4 h-4 animate-ping" /> : <Sparkles className="w-4 h-4 animate-bounce" />}
                          <span>🧬 {getContaminationTheme().name}의 생체 분광 스캔 분석서</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <p><strong>• 스캔 대상:</strong> {msg.scanData.targetName}</p>
                          <p><strong>• 소속 구역:</strong> {msg.scanData.systemName}</p>
                          <p><strong>• 생태 오염률:</strong> {contaminationLevel}% {contaminationLevel > 50 ? '(괴사 진행중)' : '(수용 한계 범위내)'}</p>
                        </div>
                        <p className="text-slate-200 text-xs pt-1 border-t border-slate-800/40">{msg.scanData.analysis}</p>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line text-xs">{msg.text}</p>
                    )}
                  </div>
                  <span className={`text-[9px] text-slate-500 ${isUser ? 'text-right' : ''}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* AI generating loader */}
          {isSending && (
            <div className="flex gap-3 max-w-[80%]">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center animate-pulse border ${
                contaminationLevel >= 80 
                  ? 'bg-purple-950/20 border-purple-500/40 text-purple-400' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {contaminationLevel >= 80 ? <Skull className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl rounded-tl-none p-3 flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 animate-spin ${contaminationLevel >= 80 ? 'text-purple-400' : 'text-rose-400'}`} />
                <span className="text-slate-400 text-xs">
                  {contaminationLevel >= 80 
                    ? '나노 도미네이터가 인체 세포 자멸 무력화 회로를 주파 변조 중...' 
                    : contaminationLevel >= 50
                      ? '닥터 나노가 글리치 걸린 임상 데이터베이스 교란 필터링 중...'
                      : '닥터 나노가 정밀 생리학 교재 데이터베이스 대조 검색 중...'}
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Prompts Row */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/80 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {getSuggestedPrompts().map((p, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(p)}
              disabled={isSending || isScanning}
              className="py-1 px-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-full text-[10px] hover:border-cyan-500 hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              💬 {p}
            </button>
          ))}
        </div>

        {/* Chat input box */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2 items-center">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
            placeholder={
              isScanning 
                ? '센서 정밀 분광 스캔 중에는 통신이 격리됩니다...' 
                : '닥터 나노에게 인체나 장벽 구조물에 대해 무엇이든 질문하세요...'
            }
            disabled={isSending || isScanning}
            className="flex-1 py-2 px-3.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage(userInput)}
            disabled={isSending || isScanning || !userInput.trim()}
            className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
