import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Activity, Brain, Wind, Compass, Sparkles, Terminal, 
  Settings, User, Shield, AlertOctagon, HelpCircle, Power, ChevronRight, Clock,
  Skull, Trash2, Flame, ShieldAlert, Send, Database, RefreshCw, Play, Pause,
  ArrowRightLeft, AlertTriangle
} from 'lucide-react';
import ThreeDCanvas from './components/ThreeDCanvas';
import { BodySystem, ChatMessage, ScanTarget, SystemType } from './types';

// Declare the 4 highly detailed bio-systems for exploration
const SYSTEM_PROFILES: BodySystem[] = [
  {
    id: 'cardiovascular',
    name: '순환 혈관계',
    nameEn: 'Cardiovascular',
    description: '심장과 연계되어 온몸 구석구석 산소와 면역 세포를 실어 나르는 혈액 고속도로입니다. 담배 연기로 흡입된 니코틴은 혈관을 급격히 수축시키며, 알코올성 아세트알데히드는 모세혈관의 혈전을 유발해 산소 전달을 방해합니다.',
    color: 'from-red-600 to-rose-950',
    accentColor: '#ef4444',
    speedLabel: '혈류 가속',
    envTemperature: '36.5',
    surroundingPH: '7.4',
    scanTargets: [], // Hydrated dynamically in 3D canvas
  },
  {
    id: 'digestive',
    name: '위장 소화계',
    nameEn: 'Digestive',
    description: '음식물을 살균, 분쇄하고 영양소를 혈액으로 빨아들이는 대형 화학 기지입니다. 술(알코올)을 빈 속에 들이부을 시, 위산과 어우러져 위샘 점막의 지질 이중막을 용해하고 소장 융털의 세포를 탈수 및 괴사시킵니다.',
    color: 'from-amber-600 to-yellow-950',
    accentColor: '#f59e0b',
    speedLabel: '연동 가속',
    envTemperature: '37.2',
    surroundingPH: '1.8',
    scanTargets: [],
  },
  {
    id: 'respiratory',
    name: '호흡 폐포계',
    nameEn: 'Respiratory',
    description: '신선한 기류가 유입되어 가스교환이 일어나는 호흡 통로입니다. 흡연 시 방출되는 시커먼 끈적한 타르(Tar)는 기관지의 미세 청소 섬모들을 시커멓게 뒤덮어 운동을 마비시키고, 산소 교환막(폐포)을 타버린 잿빛으로 훼손시킵니다.',
    color: 'from-sky-600 to-teal-950',
    accentColor: '#0ea5e9',
    speedLabel: '유량 가속',
    envTemperature: '35.0',
    surroundingPH: '7.35',
    scanTargets: [],
  },
  {
    id: 'nervous',
    name: '뇌 중추 신경계',
    nameEn: 'Nervous',
    description: '전기 스파크를 일으키며 뇌와 신체를 통제하는 전기 정보 지휘소입니다. 에탄올(술)은 뉴런을 감싸는 수초 보호막을 통과하여 시냅스 틈새에 알코올성 단선을 유발하고 반사 속도를 극도로 무디게 마비시킵니다.',
    color: 'from-purple-600 to-indigo-950',
    accentColor: '#8b5cf6',
    speedLabel: '임펄스 가속',
    envTemperature: '37.0',
    surroundingPH: '7.30',
    scanTargets: [],
  },
];

export default function App() {
  // Launch state
  const [isLaunched, setIsLaunched] = useState(false);
  const [launchStep, setLaunchStep] = useState(0); // 0: Idle, 1: Shrinking, 2: Synergizing, 3: Launching
  const [timeUTC, setTimeUTC] = useState('');

  // Tab Control in Sidebar
  const [activeTab, setActiveTab] = useState<'sectors' | 'toxins' | 'ai'>('sectors');

  // Main simulation state
  const [activeSystemId, setActiveSystemId] = useState<SystemType>('cardiovascular');
  const [speed, setSpeed] = useState<number>(3); // 1 to 10
  const [viewMode, setViewMode] = useState<'autopilot' | 'manual'>('autopilot');

  // Scan & AI Assistant states
  const [activeTarget, setActiveTarget] = useState<ScanTarget | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Specific, educational toxin level tracking for smoking & drinking
  const [smokingLevel, setSmokingLevel] = useState<number>(0); // 0 to 100 (Tar and nicotine index)
  const [drinkingLevel, setDrinkingLevel] = useState<number>(0); // 0 to 100 (Alcohol and acetaldehyde index)
  const [microplasticsLevel, setMicroplasticsLevel] = useState<number>(0);
  const [pathogensLevel, setPathogensLevel] = useState<number>(0);
  const [contaminationLevel, setContaminationLevel] = useState<number>(0);

  // Ship core status
  const [coreStatus, setCoreStatus] = useState({
    hullIntegrity: 100,
    energyLevel: 100,
    scanningSync: 100,
    shieldActive: true,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic average contamination level
  useEffect(() => {
    const calculated = Math.min(100, Math.max(
      smokingLevel, 
      drinkingLevel, 
      Math.floor((smokingLevel + drinkingLevel + microplasticsLevel + pathogensLevel) / 3)
    ));
    setContaminationLevel(calculated);
  }, [smokingLevel, drinkingLevel, microplasticsLevel, pathogensLevel]);

  // Keep live clock running
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUTC(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Jitter ship energy for sci-fi immersive telemetry
  useEffect(() => {
    if (!isLaunched) return;
    const interval = setInterval(() => {
      setCoreStatus(prev => {
        const jitterEnergy = Math.random() > 0.7 ? -0.15 : 0.05;
        return {
          ...prev,
          energyLevel: Math.max(50, Math.min(100, +(prev.energyLevel + jitterEnergy).toFixed(2))),
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isLaunched]);

  // Auto-scroll chat terminal on update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  // Initialize AI Welcome Message
  const handleLaunch = () => {
    setLaunchStep(1);
    setTimeout(() => setLaunchStep(2), 1200);
    setTimeout(() => setLaunchStep(3), 2400);

    setTimeout(() => {
      setIsLaunched(true);
      setChatHistory([
        {
          id: 'welcome-log',
          sender: 'assistant',
          text: `대장님, 무사히 인체 마이크로 탑사선 '나노 로버'에 접속하셨습니다!

현재 탐사선은 '순환 혈관계' 구역 초입에 성공적으로 안착하였으며, 안전한 자율 운항(Autopilot) 주행을 지원하고 있습니다.

이참에 우리는 인류를 심각하게 망가뜨리는 기호 물질인 [🚬 담배(타르/니코틴)] 및 [🍺 술(알코올/아세트알데히드)] 독소가 인체 장벽 세포와 뉴런을 어떻게 망가뜨리는지 교육용 시뮬레이션 및 고증을 직접 수행하겠습니다.

오른쪽의 [유독 주입 (Toxins)] 탭을 통해 직접 극약 주입을 조절하며, 3D 탐사 화면에서 실시간으로 망가지는 실질적이고 가혹한 임상 병리 현상을 눈으로 똑똑히 관찰해보십시오.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }, 3600);
  };

  const activeSystem = SYSTEM_PROFILES.find(s => s.id === activeSystemId) || SYSTEM_PROFILES[0];

  // System navigation jumping
  const handleSystemChange = (systemId: SystemType) => {
    setActiveSystemId(systemId);
    setActiveTarget(null);

    const sys = SYSTEM_PROFILES.find(s => s.id === systemId)!;

    setChatHistory(prev => [
      ...prev,
      {
        id: `sys-change-${Date.now()}`,
        sender: 'system',
        text: `🌀 탐사 구역 리라우팅: [${sys.name} (${sys.nameEn})] 으로 마이크로 워프 게이트를 개방합니다...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `sys-ai-init-${Date.now()}`,
        sender: 'assistant',
        text: `새로운 탐사 좌표인 '${sys.name}' 구역에 진입했습니다. 센서 주파수를 pH ${sys.surroundingPH} 환경에 매칭하였습니다. 어떤 조직을 가장 먼저 정밀 분석해 볼까요? 주변 표적을 클릭해 주십시오.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Switch Autopilot/Manual steering helper
  const handleManualSteerPrompt = () => {
    setViewMode('manual');
    setChatHistory(prev => [
      ...prev,
      {
        id: `steer-msg-${Date.now()}`,
        sender: 'system',
        text: '🎮 수동 조종 가동: 이제 WASD 키 및 방향키로 탐사선을 직접 비행할 수 있습니다. 벽면에 밀착할수록 충돌 위험이 상승합니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Inject toxin simulation
  const injectToxin = (type: 'tar' | 'alcohol' | 'virus' | 'plastic') => {
    let increase = 15;
    let name = '';
    let description = '';
    let logIcon = '☣️';

    if (type === 'tar') {
      name = '담배 타르(Tar) 수용액 투하';
      description = '검고 끈적한 발암성 석유 화합물 타르(Tar)가 세기관지 벽과 폐포 단막을 검게 덮쳐버립니다. 호흡기를 청소해야 할 모세 섬모들이 마비되어 석화되고 산소교환율이 폭락합니다.';
      setSmokingLevel(prev => Math.min(100, prev + 25));
      increase = 25;
    } else if (type === 'alcohol') {
      name = '아세트알데히드(Acetaldehyde) 살포';
      description = '알코올 1급 가혹 대사물인 아세트알데히드가 주입되어 장기 점막의 지질 이중막 세포벽을 즉각 산화시키고, 신경 수초를 쇼크시켜 단선을 초래합니다.';
      setDrinkingLevel(prev => Math.min(100, prev + 25));
      increase = 25;
    } else if (type === 'virus') {
      name = '나노 바이러스 면역 패소젠 방출';
      description = '면역 대식 세포를 유린하고 자멸 아포토시스를 강제 촉진하는 가시 코로나성 병원 바이러스를 대량 증식 유포합니다.';
      setPathogensLevel(prev => Math.min(100, prev + 25));
      increase = 20;
      logIcon = '👾';
    } else if (type === 'plastic') {
      name = '초미세 나노플라스틱 칼날 입자 배포';
      description = '크기 10nm 이하의 미세한 플라스틱 톱날들이 모세 혈관 장벽과 뇌 신경막을 물리적으로 찢고 긁어 전류 누전을 유발합니다.';
      setMicroplasticsLevel(prev => Math.min(100, prev + 15));
      increase = 15;
      logIcon = '💎';
    }

    // Inflict slight structural damage on ship
    setCoreStatus(prev => ({
      ...prev,
      hullIntegrity: Math.max(25, prev.hullIntegrity - 6),
      scanningSync: Math.max(30, prev.scanningSync - 4),
    }));

    setChatHistory(prev => [
      ...prev,
      {
        id: `toxin-${Date.now()}`,
        sender: 'system',
        text: `${logIcon} [생체 파괴 지령] ${name} 실행! (+${increase}%)\n────────────────────\n${description}\n\n⚠️ 임상 위해 고증: 세포 손상과 Cilia(섬모) 마비가 비행 화면에 실시간으로 반영됩니다.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Full system Detox & flush
  const handleDetox = () => {
    setSmokingLevel(0);
    setDrinkingLevel(0);
    setPathogensLevel(0);
    setMicroplasticsLevel(0);
    setContaminationLevel(0);

    setCoreStatus(prev => ({
      hullIntegrity: 100,
      energyLevel: 100,
      scanningSync: 100,
      shieldActive: true,
    }));

    setChatHistory(prev => [
      ...prev,
      {
        id: `detox-${Date.now()}`,
        sender: 'system',
        text: '🧹 [생체 대정화 완료] 글루타치온 복합 나노 중화제 가동!\n────────────────────\n혈관 장벽의 타르 찌꺼기를 세척하고 유독 아세트알데히드를 무해한 아세트산으로 완벽 분해 중화하였습니다. 호흡기관 섬모들이 다시 건강하게 왕복 운동을 재개합니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Trigger Spectrometer Scan Report from Gemini API
  const triggerScan = async (target: ScanTarget) => {
    if (isScanning) return;
    setIsScanning(true);
    setActiveTarget({ ...target, scanned: true });

    const scanStartMsg: ChatMessage = {
      id: `scan-start-${Date.now()}`,
      sender: 'system',
      text: `📡 분광 분절 락온: [${target.name}] 타겟 파장 동조 정밀 해독 개시...`,
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
          systemType: activeSystem.name,
          contaminationLevel: contaminationLevel,
        }),
      });

      if (!response.ok) throw new Error('Scan failed');
      const data = await response.json();

      setCoreStatus(prev => ({ ...prev, scanningSync: Math.min(100, prev.scanningSync + 5) }));

      const scanResultMsg: ChatMessage = {
        id: `scan-result-${Date.now()}`,
        sender: 'assistant',
        text: data.analysis,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scanData: {
          targetName: target.name,
          systemName: activeSystem.name,
          analysis: data.analysis,
        },
      };

      setChatHistory(prev => [...prev, scanResultMsg]);
    } catch (err) {
      console.error(err);
      const scanFailMsg: ChatMessage = {
        id: `scan-fail-${Date.now()}`,
        sender: 'system',
        text: `⚠️ 무전 해독 교란: 오염 및 전하 간섭이 심해 [${target.name}] 정밀 분사 보고서를 수신하지 못했습니다.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory(prev => [...prev, scanFailMsg]);
    } finally {
      setIsScanning(false);
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
          systemType: activeSystem.id,
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
        text: '⚠️ 채널 혼선: AI 메인보드 전송망 노이즈가 강해 로컬 백업 응답으로 간략 대체되었습니다. (수신 불가)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Preset suggested questions depending on system
  const getSuggestedQuestions = () => {
    switch (activeSystemId) {
      case 'cardiovascular':
        return [
          '🚬 흡연 시 니코틴이 심장 관상동맥에 미치는 파괴적인 영향은?',
          '🍺 알코올성 적혈구 엉킴 및 산소 부족 현상이란?',
          '백혈구와 적혈구의 역할 차이를 설명해줘.',
        ];
      case 'digestive':
        return [
          '🍺 빈속에 고농도 소주나 위스키를 먹으면 위벽 세포가 왜 녹나요?',
          '위벽을 덮는 카펫 같은 소장 융털은 알코올에 어떤 피해를 입나요?',
          '위산 분출구가 유독 자극되는 이유는?',
        ];
      case 'respiratory':
        return [
          '🚬 담배 연기 속 검은 타르 타액이 허파꽈리(폐포)에 쌓이면 어떻게 되나요?',
          '기관지 청소 섬모가 흡연으로 마비되면 몸에서 감지하는 증상은?',
          '산소가 헤모글로빈에 무사히 결합해야 하는 생리학적 이유는?',
        ];
      case 'nervous':
        return [
          '🍺 에탄올이 시냅스 전위 전달 속도를 어떻게 교란하나요?',
          '뇌세포 수초 보호막이 독성물질로 유실되면 발생하는 마비 증상은?',
          '번쩍이는 전자기 신경 충격의 전달 속도는?',
        ];
    }
  };

  // Determine theme styling based on contaminationLevel
  const getThemeClass = () => {
    if (contaminationLevel >= 80) {
      return {
        bg: 'bg-purple-950/20 border-purple-500/30',
        text: 'text-purple-400',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
        accent: 'purple-500',
        title: 'NANO-DOMINATOR (SYSTEM CORRUPTED)'
      };
    } else if (contaminationLevel >= 50) {
      return {
        bg: 'bg-red-950/20 border-red-500/30',
        text: 'text-red-400',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        accent: 'red-500',
        title: 'DR. NANO GLITCH (SECTOR WARNING)'
      };
    } else if (contaminationLevel >= 20) {
      return {
        bg: 'bg-yellow-950/10 border-yellow-500/20',
        text: 'text-yellow-400',
        glow: '',
        accent: 'yellow-500',
        title: 'NANO ROVER (MODERATE HAZARD)'
      };
    }
    return {
      bg: 'bg-cyan-950/10 border-cyan-500/20',
      text: 'text-cyan-400',
      glow: '',
      accent: 'cyan-500',
      title: 'NANO ROVER ASSISTANT: DR. NANO'
    };
  };

  const activeTheme = getThemeClass();

  // Dynamic system change trigger from canvas lock-on
  useEffect(() => {
    if (activeTarget && !activeTarget.scanned) {
      triggerScan(activeTarget);
    }
  }, [activeTarget]);

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col font-sans select-none antialiased overflow-x-hidden">
      
      {/* =========================================================================
          A. PRE-LAUNCH / LOADING LAUNCH DOCK SCREEN
          ========================================================================= */}
      {!isLaunched ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          
          <div className="absolute top-8 left-8 border-t-2 border-l-2 border-slate-800 w-12 h-12 pointer-events-none" />
          <div className="absolute top-8 right-8 border-t-2 border-r-2 border-slate-800 w-12 h-12 pointer-events-none" />
          <div className="absolute bottom-8 left-8 border-b-2 border-l-2 border-slate-800 w-12 h-12 pointer-events-none" />
          <div className="absolute bottom-8 right-8 border-b-2 border-r-2 border-slate-800 w-12 h-12 pointer-events-none" />

          <div className="max-w-2xl w-full bg-slate-950/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-[0_0_50px_rgba(30,41,59,0.3)] flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-rose-500 to-purple-500" />
            
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-full text-[10px] font-mono tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              MICRO-PHYSIOLOGY LAB: LAB 04
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 mt-5 text-center tracking-tight font-mono">
              3D 인체 혈관 탐사선 : 나노 로버
            </h1>
            <p className="text-slate-400 text-xs md:text-sm text-center max-w-lg mt-2 leading-relaxed">
              100만분의 1 배율로 소형화된 선박에 접속하여 순환계, 호흡계, 소화계, 중추신경계를 가로질러 탐사합니다. 특히 흡연(타르)과 음주(알코올)가 생체 조직에 미치는 즉각적인 질병 발생 양상을 3D 인터랙션으로 관측해 보십시오.
            </p>

            <div className="relative my-7 w-48 h-48 flex items-center justify-center bg-slate-900/40 border border-slate-800/80 rounded-full shadow-inner">
              <div className="absolute inset-2 border border-dashed border-cyan-500/20 rounded-full animate-spin-slow" />
              <div className="absolute inset-6 border border-dashed border-rose-500/10 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
              
              <svg className="w-28 h-28 text-cyan-500/80 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M50,15 A8,8 0 1,0 50,31 A8,8 0 1,0 50,15" strokeLinecap="round" />
                <path d="M50,31 L50,65" />
                <path d="M30,38 L70,38" />
                <path d="M30,38 L22,58 L16,75" strokeLinecap="round" />
                <path d="M70,38 L78,58 L84,75" strokeLinecap="round" />
                <path d="M50,65 L36,92" strokeLinecap="round" />
                <path d="M50,65 L64,92" strokeLinecap="round" />
                <circle cx="50" cy="48" r="3" fill="#ef4444" className="animate-ping" />
                <circle cx="50" cy="22" r="2.5" fill="#a78bfa" className="animate-ping" style={{ animationDelay: '0.4s' }} />
                <circle cx="50" cy="58" r="2" fill="#f59e0b" />
                <circle cx="44" cy="42" r="2" fill="#0ea5e9" />
              </svg>
            </div>

            {launchStep > 0 ? (
              <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-[11px] text-slate-300 flex flex-col gap-1.5 shadow-md">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-cyan-400 font-bold">나노 모터 부팅 로그</span>
                  <span className="text-slate-500">EST_SEC: {4 - launchStep}s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>동역학 양자 모터 동기화 완비 (100%)</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-all duration-300 ${launchStep >= 1 ? 'opacity-100 text-slate-100' : 'opacity-30'}`}>
                  <span>{launchStep >= 1 ? '✓' : '■'}</span>
                  <span>분자 밀도 축소 엔진 가동... 100만분의 1 배율 돌입</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-all duration-300 ${launchStep >= 2 ? 'opacity-100 text-slate-100' : 'opacity-30'}`}>
                  <span>{launchStep >= 2 ? '✓' : '■'}</span>
                  <span>생체 전자기장 장막 보존 보쉴드 주입 완료</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-all duration-300 ${launchStep >= 3 ? 'opacity-100 text-cyan-400 font-bold animate-pulse' : 'opacity-30'}`}>
                  <span>{launchStep >= 3 ? '▶' : '■'}</span>
                  <span>혈관 주입 게이트 로드 개시! 순환 혈관계 전이!</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLaunch}
                className="group relative px-8 py-4 bg-gradient-to-r from-rose-600 via-amber-600 to-cyan-600 hover:scale-[1.03] active:scale-[0.98] transition-all rounded-xl text-white font-bold font-mono tracking-wider shadow-lg shadow-rose-500/20 hover:shadow-cyan-500/40 flex items-center gap-2 cursor-pointer"
              >
                <Power className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500 text-amber-300" />
                나노선 기동 & 인체 혈관 발사 (LAUNCH)
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <div className="mt-8 pt-5 border-t border-slate-900 w-full flex justify-between items-center text-[10px] font-mono text-slate-600">
              <span>EXPLORER SYSTEM: ROVER-V2</span>
              <span>EDUCATIONAL PROTOTYPE v2.6</span>
            </div>

          </div>
        </div>
      ) : (
        /* =========================================================================
            B. MAIN IMMERSIVE COCKPIT INTERFACE (SPLIT VIEW)
            ========================================================================= */
        <div className="flex-1 flex flex-col lg:flex-row p-3 md:p-5 gap-5 h-auto lg:h-[calc(100vh-20px)] overflow-y-auto lg:overflow-hidden">
          
          {/* LEFT COLUMN: Wide 3D Flying View & Flight Console HUD (65%) */}
          <div className="flex-1 flex flex-col gap-4 lg:overflow-hidden lg:h-full">
            
            {/* Left Top: Dynamic Flight HUD banner */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-2 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-xs font-black font-mono tracking-wider flex items-center gap-1.5 leading-none">
                    <span>COCKPIT MONITORS:</span>
                    <span className="text-cyan-400 uppercase font-bold">{activeSystem.nameEn}</span>
                  </h2>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5 leading-none">
                    COORDINATE STREAM: X=<span id="stream-x" className="text-slate-300">0.0</span>, Y=<span id="stream-y" className="text-slate-300">0.0</span> | REGION STABLE
                  </p>
                </div>
              </div>

              {/* Target lock overlay */}
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
                <div className="flex flex-col text-right font-mono text-[9px] leading-tight">
                  <span className="text-slate-500 text-[8px]">BIO-DETECTOR SCAN LOCK</span>
                  {activeTarget ? (
                    <span className="text-rose-400 font-bold">{activeTarget.name}</span>
                  ) : (
                    <span className="text-slate-400 animate-pulse">SEARCHING SURFACE CELL...</span>
                  )}
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${activeTarget ? 'bg-rose-500 animate-ping' : 'bg-slate-700'}`} />
              </div>

              {/* Quick escape */}
              <button
                onClick={() => {
                  if (window.confirm('나노 탐사선에서 비상 탈출하여 현실 기지로 복귀하시겠습니까?')) {
                    setIsLaunched(false);
                    setLaunchStep(0);
                  }
                }}
                className="py-1 px-2.5 bg-red-950/30 border border-red-900/40 hover:bg-red-900/60 hover:text-white rounded text-red-400 font-mono text-[9px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <AlertOctagon className="w-3 h-3" />
                EJECT
              </button>
            </div>

            {/* Left Center: Giant Immersive 3D Space Canvas */}
            <div className="flex-1 relative bg-slate-950 rounded-2xl border border-slate-800 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] overflow-hidden min-h-[300px]">
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />

              <ThreeDCanvas
                system={activeSystemId}
                speed={speed}
                viewMode={viewMode}
                onScanTarget={(target) => {
                  setActiveTarget(target);
                }}
                activeTarget={activeTarget}
                contaminationLevel={contaminationLevel}
                smokingLevel={smokingLevel}
                drinkingLevel={drinkingLevel}
              />

              {/* Autopilot HUD flag */}
              {viewMode === 'manual' ? (
                <div className="absolute bottom-3 right-3 bg-amber-500/10 border border-amber-500/40 px-2 py-1 rounded font-mono text-[8px] text-amber-400 flex items-center gap-1.5 animate-pulse">
                  <AlertOctagon className="w-3 h-3" />
                  수동 조종 작동 중 (WASD 조작 가능)
                </div>
              ) : (
                <div className="absolute bottom-3 right-3 bg-cyan-500/10 border border-cyan-500/40 px-2 py-1 rounded font-mono text-[8px] text-cyan-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  자율 주행 안정 순항 (AUTOPILOT ACTIVE)
                </div>
              )}
            </div>

            {/* Left Bottom: Consolidated Flight Console Dashboard */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col md:flex-row items-stretch justify-between gap-4 shadow-lg shrink-0">
              
              {/* Flight mode choice & throttle speed */}
              <div className="flex-1 flex flex-col gap-2 bg-slate-900/40 border border-slate-800/60 p-2.5 rounded-lg">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">FLIGHT STEERING & SPEED</span>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setViewMode('autopilot')}
                    className={`flex-1 py-1 px-2.5 rounded font-mono text-[10px] font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                      viewMode === 'autopilot'
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950/40 border-slate-850 text-slate-500'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    AUTOPILOT
                  </button>
                  <button
                    onClick={handleManualSteerPrompt}
                    className={`flex-1 py-1 px-2.5 rounded font-mono text-[10px] font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                      viewMode === 'manual'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-950/40 border-slate-850 text-slate-500'
                    }`}
                  >
                    <Pause className="w-3 h-3" />
                    MANUAL STEER
                  </button>
                </div>
                {/* Speed Range Slider */}
                <div className="flex items-center gap-3 mt-1 pt-1 border-t border-slate-900">
                  <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">추진 파워 {speed}0%</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={speed}
                    onChange={(e) => setSpeed(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Consolidated Telemetry values */}
              <div className="flex-1 grid grid-cols-3 gap-2.5 text-xs font-mono">
                
                {/* Ship Integrity Gauge */}
                <div className="bg-slate-900/40 border border-slate-800 p-2 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] text-slate-500 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    격막 보호도
                  </span>
                  <span className="text-sm font-bold text-slate-200 mt-1">{coreStatus.hullIntegrity}%</span>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-emerald-500" style={{ width: `${coreStatus.hullIntegrity}%` }} />
                  </div>
                </div>

                {/* Energy remaining */}
                <div className="bg-slate-900/40 border border-slate-800 p-2 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] text-slate-500 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                    배터리 용량
                  </span>
                  <span className="text-sm font-bold text-slate-200 mt-1">{coreStatus.energyLevel}%</span>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${coreStatus.energyLevel}%` }} />
                  </div>
                </div>

                {/* DB sync status */}
                <div className="bg-slate-900/40 border border-slate-800 p-2 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] text-slate-500 flex items-center gap-1">
                    <Database className="w-3 h-3 text-cyan-400" />
                    스캔 업로드
                  </span>
                  <span className="text-sm font-bold text-slate-200 mt-1">{coreStatus.scanningSync}%</span>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-cyan-500" style={{ width: `${coreStatus.scanningSync}%` }} />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* =========================================================================
              RIGHT COLUMN: TABBED EDUCATIONAL SCI-FI SIDEBAR TERMINAL (35%)
              ========================================================================= */}
          <div className="w-full lg:w-[410px] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden h-[540px] lg:h-full shrink-0">
            
            {/* Sidebar tab controller tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950 shrink-0">
              <button
                onClick={() => setActiveTab('sectors')}
                className={`flex-1 py-3 text-[11px] font-mono font-bold tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'sectors'
                    ? 'border-cyan-500 text-cyan-400 bg-slate-900/50'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/10'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                탐사 구역
              </button>
              <button
                onClick={() => setActiveTab('toxins')}
                className={`flex-1 py-3 text-[11px] font-mono font-bold tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'toxins'
                    ? 'border-rose-500 text-rose-400 bg-slate-900/50'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/10'
                }`}
              >
                <Skull className="w-3.5 h-3.5" />
                독성 주입
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 text-[11px] font-mono font-bold tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer relative ${
                  activeTab === 'ai'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900/50'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/10'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                닥터 나노 AI
                {chatHistory.length > 0 && activeTab !== 'ai' && (
                  <span className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            </div>

            {/* TAB CONTENT PORTAL */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/40">
              
              {/* TAB 1: SECTORS SELECTOR (Explore location) */}
              {activeTab === 'sectors' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div className="border-b border-slate-800/80 pb-2 flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase">Select Explore Bio-Sector</span>
                    <span className="text-[9px] font-mono text-cyan-400 animate-pulse">RE-ROUTING CAPABLE</span>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    {SYSTEM_PROFILES.map((sys) => {
                      const isActive = sys.id === activeSystemId;
                      return (
                        <button
                          key={sys.id}
                          onClick={() => handleSystemChange(sys.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col gap-2 group cursor-pointer ${
                            isActive
                              ? 'bg-slate-900/90 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.12)] scale-[1.01]'
                              : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 hover:bg-slate-900/30'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ backgroundColor: sys.accentColor }} />
                          )}

                          <div className="flex justify-between items-center w-full">
                            <span className="text-[10px] font-mono font-extrabold text-slate-500 uppercase tracking-wider">
                              {sys.nameEn}
                            </span>
                            <span className="text-[10px] font-mono font-bold" style={{ color: sys.accentColor }}>
                              pH {sys.surroundingPH}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                            {sys.id === 'cardiovascular' && <Heart className="w-4 h-4 text-rose-500" />}
                            {sys.id === 'digestive' && <Activity className="w-4 h-4 text-amber-500" />}
                            {sys.id === 'respiratory' && <Wind className="w-4 h-4 text-sky-500" />}
                            {sys.id === 'nervous' && <Brain className="w-4 h-4 text-purple-500" />}
                            {sys.name}
                          </h3>

                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {sys.description}
                          </p>

                          <div className="pt-2 mt-1 border-t border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-500">
                            <span>환경 체온: {sys.envTemperature}°C</span>
                            <span>가속 가동: {sys.speedLabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: TOXIN LAB & SIMULATOR CONTROL PANEL */}
              {activeTab === 'toxins' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div className="border-b border-slate-800/80 pb-2 flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1">
                      <Skull className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      TOXIN LEVEL INJECTORS
                    </span>
                    <span className="text-[9px] font-mono text-rose-400 font-bold">{contaminationLevel}% INTRUSION</span>
                  </div>

                  {/* Scientific Toxin Level indicators gauges */}
                  <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex flex-col gap-3 font-mono">
                    <span className="text-[9px] text-slate-500 uppercase font-bold border-b border-slate-800 pb-1">장기 손상 및 유독 축적도 모니터</span>
                    
                    {/* Tar/Nicotine Gauge */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-300">🚬 흡연 타르/니코틴 축적 (Respiratory Cilia)</span>
                        <span className={`font-bold ${smokingLevel > 50 ? 'text-rose-400' : 'text-slate-300'}`}>{smokingLevel}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div className="h-full bg-slate-600 rounded-full transition-all duration-500" style={{ width: `${smokingLevel}%` }} />
                      </div>
                      <span className="text-[8px] text-slate-500">
                        {smokingLevel > 60 ? '기관지 섬모 마비완료 · 폐포 세포 산화 괴사진행 중' : smokingLevel > 30 ? '섬모 정밀 왕복 운동 점차 둔화 및 잿빛 오염 발생' : '정상적인 호흡 가스 교환 활성화'}
                      </span>
                    </div>

                    {/* Alcohol/Acetaldehyde Gauge */}
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-300">🍺 술 알코올/아세트알데히드 (Stomach Villi)</span>
                        <span className={`font-bold ${drinkingLevel > 50 ? 'text-amber-400' : 'text-slate-300'}`}>{drinkingLevel}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${drinkingLevel}%` }} />
                      </div>
                      <span className="text-[8px] text-slate-500">
                        {drinkingLevel > 60 ? '세포 인지질 용해 장벽 붕괴 · 시냅스 단선 전해 교란' : drinkingLevel > 30 ? '느려진 신호 반응 전위 지연 · 위막 붓기 경미 발생' : '소화 벽 소장 융털 정상 세포 밀집'}
                      </span>
                    </div>

                    {/* Pathogen Gauge */}
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-300">👾 나노 면역 변이 패소젠</span>
                        <span className="text-slate-300 font-bold">{pathogensLevel}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-fuchsia-500 transition-all duration-500" style={{ width: `${pathogensLevel}%` }} />
                      </div>
                    </div>

                    {/* Microplastics Gauge */}
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-300">💎 나노 플라스틱 입자율</span>
                        <span className="text-slate-300 font-bold">{microplasticsLevel}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${microplasticsLevel}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Injector Control Buttons */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1">유발 가능한 생리학적 오염 시약</span>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={() => injectToxin('tar')}
                        disabled={smokingLevel >= 100}
                        className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all text-left flex items-start gap-3 disabled:opacity-45 cursor-pointer group"
                      >
                        <span className="p-2 bg-slate-950 border border-slate-800 rounded-lg group-hover:scale-105 transition-transform text-slate-500">🚬</span>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-200">담배 타르(Tar) 점액질 주입 (+25%)</div>
                          <p className="text-[10px] text-slate-500 mt-1 font-sans">기관지 상피 섬모들을 끈적하게 달라붙여 고정 마비시키고 호흡 통로를 거칠게 뒤덮어 산소 헤모글로빈 차단</p>
                        </div>
                      </button>

                      <button
                        onClick={() => injectToxin('alcohol')}
                        disabled={drinkingLevel >= 100}
                        className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all text-left flex items-start gap-3 disabled:opacity-45 cursor-pointer group"
                      >
                        <span className="p-2 bg-slate-950 border border-slate-800 rounded-lg group-hover:scale-105 transition-transform text-amber-500">🍺</span>
                        <div>
                          <div className="text-xs font-mono font-bold text-amber-400">아세트알데히드(Acetaldehyde) 투여 (+25%)</div>
                          <p className="text-[10px] text-slate-500 mt-1 font-sans">알코올 유독 1급 대사물로 이중 인지질 장벽 세포 점막을 사정없이 용융 부식시키고 신경 회로 단선 단락 쇼크 유도</p>
                        </div>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => injectToxin('virus')}
                          disabled={pathogensLevel >= 100}
                          className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all text-left flex flex-col gap-1 disabled:opacity-45 cursor-pointer"
                        >
                          <span className="text-[11px] font-mono font-bold text-fuchsia-400 flex items-center gap-1">
                            👾 면역 변이 패소젠
                          </span>
                          <span className="text-[8px] text-slate-500 font-sans">세포 아포토시스 촉진 (+20%)</span>
                        </button>

                        <button
                          onClick={() => injectToxin('plastic')}
                          disabled={microplasticsLevel >= 100}
                          className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all text-left flex flex-col gap-1 disabled:opacity-45 cursor-pointer"
                        >
                          <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                            💎 나노 플라스틱
                          </span>
                          <span className="text-[8px] text-slate-500 font-sans">세포막 물리적 찢김 칼날 (+15%)</span>
                        </button>
                      </div>

                    </div>

                    {/* Detox Trigger */}
                    <button
                      onClick={handleDetox}
                      className="mt-4 py-3 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/60 text-emerald-400 font-mono font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 animate-bounce" />
                      전신 디톡스 & 세포 해독 정화 (FULL FLUSH DETOX)
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: DYNAMIC AI ASSISTANT TERMINAL LOGS & CHAT */}
              {activeTab === 'ai' && (
                <div className="flex flex-col gap-4 h-full min-h-[380px] animate-fade-in relative">
                  
                  {/* Dynamic AI Status Board */}
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 bg-slate-950 transition-all duration-300 ${activeTheme.bg}`}>
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      {contaminationLevel > 50 && (
                        <div className="absolute inset-0 rounded-full bg-red-400 animate-ping" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-wider leading-none uppercase">
                      {activeTheme.title}
                    </span>
                  </div>

                  {/* Terminal chat messages area */}
                  <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[11px] leading-relaxed max-h-[290px] pr-1.5">
                    {chatHistory.map((msg) => {
                      const isUser = msg.sender === 'user';
                      const isSystem = msg.sender === 'system';
                      
                      let bubbleClass = 'bg-slate-900/60 border-slate-850 text-slate-300';
                      let iconLabel = '🤖';
                      let labelColor = 'text-cyan-400';

                      if (isUser) {
                        bubbleClass = 'bg-slate-900 border-cyan-950 text-slate-100 ml-auto rounded-tr-none';
                        iconLabel = '👨‍✈️';
                        labelColor = 'text-cyan-300';
                      } else if (isSystem) {
                        bubbleClass = 'bg-red-950/20 border-red-900/30 text-rose-400 font-bold border-l-4 border-l-red-500';
                        iconLabel = '⚠️';
                        labelColor = 'text-rose-500';
                      } else {
                        // AI personality shift theme
                        if (contaminationLevel >= 80) {
                          bubbleClass = 'bg-purple-950/30 border-purple-900/40 text-purple-200 rounded-tl-none';
                          iconLabel = '💀';
                          labelColor = 'text-purple-400';
                        } else if (contaminationLevel >= 50) {
                          bubbleClass = 'bg-red-950/20 border-red-900/30 text-red-200 rounded-tl-none';
                          iconLabel = '🚨';
                          labelColor = 'text-red-400';
                        } else if (contaminationLevel >= 20) {
                          bubbleClass = 'bg-yellow-950/10 border-yellow-900/20 text-yellow-100 rounded-tl-none';
                          iconLabel = '🤖';
                          labelColor = 'text-yellow-400';
                        }
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col gap-1 max-w-[92%] ${isUser ? 'ml-auto' : ''}`}
                        >
                          <div className="flex items-center gap-1 text-[9px] text-slate-500">
                            <span className={labelColor}>{iconLabel}</span>
                            <span>{isUser ? 'COCKPIT PILOT' : isSystem ? 'BIOMETRIC COMMANDS' : 'DOCTOR NANO CORE'}</span>
                            <span className="text-[8px] text-slate-600">({msg.timestamp})</span>
                          </div>

                          <div className={`p-3 rounded-xl border ${bubbleClass} whitespace-pre-line`}>
                            {/* Format Spectrometer scan output card if present */}
                            {msg.scanData ? (
                              <div className="space-y-2 font-mono">
                                <div className="flex items-center gap-1.5 text-rose-400 font-bold border-b border-rose-950 pb-1 text-[11px]">
                                  <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                                  <span>🧬 분광 대조 정밀 진단 보고서</span>
                                </div>
                                <div className="text-[10px] text-slate-400 space-y-0.5 leading-tight">
                                  <p><strong>· 스캔 조직:</strong> {msg.scanData.targetName}</p>
                                  <p><strong>· 위치 계통:</strong> {msg.scanData.systemName}</p>
                                  <p><strong>· 오염 오염도:</strong> {contaminationLevel}% {contaminationLevel > 50 ? '(조직 괴사 진행중)' : '(수용 한계내)'}</p>
                                </div>
                                <div className="text-slate-300 text-[10.5px] pt-1.5 border-t border-slate-900/60 leading-normal font-sans">
                                  {msg.scanData.analysis}
                                </div>
                              </div>
                            ) : (
                              msg.text
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* AI typing/analyzing loaders */}
                    {isSending && (
                      <div className="flex gap-2 items-start max-w-[85%] animate-pulse">
                        <span className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 text-[11px]">⚙️</span>
                        <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl rounded-tl-none text-[10px] text-slate-500">
                          {contaminationLevel >= 80 
                            ? '나노 도미네이터가 숙주 세포 자멸 무력회 회로 주파 변조 중...' 
                            : contaminationLevel >= 50
                              ? '닥터 나노가 마비된 폐 세포 및 미토콘드리아 클리치 데이터 변인 검색 중...'
                              : '닥터 나노가 의학 백과 데이터베이스 대조 검색 중...'}
                        </div>
                      </div>
                    )}
                    
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestion prompt question chips */}
                  <div className="pt-2 border-t border-slate-900 flex flex-col gap-1.5 shrink-0">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">추천 과학 탐사 질의</span>
                    <div className="flex flex-col gap-1.5">
                      {getSuggestedQuestions().map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          disabled={isSending}
                          className="py-1 px-2.5 bg-slate-900/50 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-left text-[9.5px] text-slate-400 rounded-lg hover:text-slate-200 transition-all truncate disabled:opacity-40 cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terminal input text field */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage(userInput);
                    }}
                    className="flex gap-2 mt-2 pt-2 border-t border-slate-900 shrink-0"
                  >
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="닥터 나노에게 의학 상식 질문..."
                      disabled={isSending}
                      className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !userInput.trim()}
                      className="p-2 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 hover:border-cyan-700 text-cyan-400 rounded-xl disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                </div>
              )}

            </div>

            {/* Sidebar bottom signature */}
            <div className="p-3 bg-slate-950 border-t border-slate-900 text-center text-[9px] font-mono text-slate-600 shrink-0">
              EXPLORER PILOT DOCK · ONLINE
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
