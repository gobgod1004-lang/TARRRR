import React, { useEffect, useRef, useState } from 'react';
import { SystemType, Particle3D, ScanTarget, Vector3D } from '../types';

interface ThreeDCanvasProps {
  system: SystemType;
  speed: number;
  viewMode: 'autopilot' | 'manual';
  onScanTarget: (target: ScanTarget) => void;
  activeTarget: ScanTarget | null;
  contaminationLevel: number;
  smokingLevel: number;
  drinkingLevel: number;
}

export default function ThreeDCanvas({
  system,
  speed,
  viewMode,
  onScanTarget,
  activeTarget,
  contaminationLevel,
  smokingLevel,
  drinkingLevel,
}: ThreeDCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Flight camera positions & angles (using refs to prevent React rendering cycle bottleneck)
  const cameraZRef = useRef<number>(0);
  const pitchRef = useRef<number>(0);
  const yawRef = useRef<number>(0);

  // Flight controls coordinates (internal physics variables)
  const camControlXRef = useRef<number>(0);
  const camControlYRef = useRef<number>(0);

  // DOM text content references for direct high-performance writing
  const coordXTextRef = useRef<HTMLSpanElement>(null);
  const coordYTextRef = useRef<HTMLSpanElement>(null);

  // Sync frequently changing props to refs to avoid tearing down the canvas rendering loop
  const speedRef = useRef<number>(speed);
  const viewModeRef = useRef<'autopilot' | 'manual'>(viewMode);
  const activeTargetRef = useRef<ScanTarget | null>(activeTarget);
  const contaminationLevelRef = useRef<number>(contaminationLevel);
  const smokingLevelRef = useRef<number>(smokingLevel);
  const drinkingLevelRef = useRef<number>(drinkingLevel);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    activeTargetRef.current = activeTarget;
  }, [activeTarget]);

  useEffect(() => {
    contaminationLevelRef.current = contaminationLevel;
  }, [contaminationLevel]);

  useEffect(() => {
    smokingLevelRef.current = smokingLevel;
  }, [smokingLevel]);

  useEffect(() => {
    drinkingLevelRef.current = drinkingLevel;
  }, [drinkingLevel]);

  // Mouse look tracking
  const isDraggingRef = useRef<boolean>(false);
  const previousMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseHoverPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseInsideRef = useRef<boolean>(false);

  // Floating particles pool
  const particlesRef = useRef<Particle3D[]>([]);
  // Scan targets pool (dynamic cyclic positions based on cameraZ)
  const scanTargetsRef = useRef<ScanTarget[]>([]);

  // Keyboard input state
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Core configuration parameters
  const FOV = 280;
  const VIEW_DISTANCE = 350; // far clipping plane
  const SEGMENT_SPACING = 12; // distance between tunnel rings
  const NUM_RINGS = 32; // number of visible rings ahead

  // Get path center in 3D for infinite snake-like path
  const getPathCenter = (z: number, currentSystem: SystemType): Vector3D => {
    switch (currentSystem) {
      case 'cardiovascular':
        return {
          x: Math.sin(z * 0.012) * 45 + Math.cos(z * 0.004) * 15,
          y: Math.cos(z * 0.01) * 35,
          z,
        };
      case 'digestive':
        return {
          x: Math.sin(z * 0.015) * 30,
          y: Math.sin(z * 0.008) * 25 + Math.cos(z * 0.02) * 15,
          z,
        };
      case 'respiratory':
        return {
          x: Math.sin(z * 0.008) * 20,
          y: Math.cos(z * 0.008) * 20,
          z,
        };
      case 'nervous':
        return {
          x: Math.sin(z * 0.025) * 50 * Math.sin(z * 0.002),
          y: Math.cos(z * 0.022) * 45 * Math.sin(z * 0.003),
          z,
        };
      default:
        return { x: 0, y: 0, z };
    }
  };

  // Get ring radius based on system
  const getRingRadius = (z: number, currentSystem: SystemType): number => {
    switch (currentSystem) {
      case 'cardiovascular':
        return 48 + Math.sin(z * 0.025) * 6; // pulsating blood vessels
      case 'digestive':
        return 60 + Math.sin(z * 0.035) * 12; // stomach peristalsis contractions
      case 'respiratory':
        return 42 + Math.cos(z * 0.01) * 8;   // bronchioles breathing expansion
      case 'nervous':
        return 34 + Math.sin(z * 0.06) * 5;   // myelin sheath fibers
    }
  };

  // Initialize particles once based on system
  const initParticles = (currentSystem: SystemType) => {
    const arr: Particle3D[] = [];
    const baseZ = cameraZRef.current;
    
    // Spawn 120 floating particles distributed ahead
    for (let i = 0; i < 120; i++) {
      const pZ = baseZ + Math.random() * VIEW_DISTANCE;
      const pathCenter = getPathCenter(pZ, currentSystem);
      const radiusLimit = getRingRadius(pZ, currentSystem) - 10;
      
      // Angle and distance from tunnel center
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radiusLimit;
      
      const pX = pathCenter.x + Math.cos(angle) * dist;
      const pY = pathCenter.y + Math.sin(angle) * dist;

      arr.push({
        id: `p-${i}-${Math.random()}`,
        type: getRandomParticleType(currentSystem),
        position: { x: pX, y: pY, z: pZ },
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          z: -Math.random() * 0.5 - (currentSystem === 'cardiovascular' ? 1.5 : 0.5), // Flow backward (blood cells flow with current!)
        },
        size: Math.random() * 5 + (currentSystem === 'cardiovascular' ? 4 : 2),
        color: getParticleColor(currentSystem),
        pulse: Math.random() * Math.PI,
      });
    }
    particlesRef.current = arr;
  };

  const getRandomParticleType = (sys: SystemType): string => {
    const contamination = contaminationLevelRef.current || 0;
    
    // As contamination increases, spawn toxin particles with higher probability
    if (contamination > 15 && Math.random() * 100 < contamination) {
      const toxicRnd = Math.random();
      if (toxicRnd < 0.25) return 'toxin_virus';   // Spiky purple pathogen virus
      if (toxicRnd < 0.50) return 'toxin_tar';     // Sticky black tar clump
      if (toxicRnd < 0.75) return 'toxin_alcohol'; // Acetaldehyde bubble
      return 'toxin_plastic';                      // Microplastic shards
    }

    if (sys === 'cardiovascular') {
      const r = Math.random();
      if (r < 0.7) return 'rbc'; // Red Blood Cell (majority)
      if (r < 0.85) return 'wbc'; // White Blood Cell
      if (r < 0.95) return 'platelet'; // Platelet
      return 'cholesterol';
    } else if (sys === 'digestive') {
      const r = Math.random();
      if (r < 0.4) return 'acid';
      if (r < 0.7) return 'glucose';
      return 'enzyme';
    } else if (sys === 'respiratory') {
      const r = Math.random();
      if (r < 0.55) return 'o2';
      if (r < 0.9) return 'co2';
      return 'dust';
    } else {
      const r = Math.random();
      if (r < 0.5) return 'action_potential';
      return 'neurotransmitter';
    }
  };

  const getParticleColor = (sys: SystemType): string => {
    const contamination = contaminationLevelRef.current || 0;
    
    // If we're rendering a toxic particle, give it a specific poisonous color
    // We can also override normal colors if contamination is extremely high (corruption glow)
    switch (sys) {
      case 'cardiovascular':
        return contamination > 60 ? '#450a0a' : '#f87171'; // Dark necrotic red vs healthy red
      case 'digestive':
        return contamination > 60 ? '#14532d' : '#fef08a'; // Toxic acid green vs bright yellow glucose
      case 'respiratory':
        return contamination > 60 ? '#0f172a' : '#38bdf8'; // Tar black vs clean oxygen cyan
      case 'nervous':
        return contamination > 60 ? '#581c87' : '#a78bfa'; // Distorted deep violet vs bright synapse electric purple
    }
  };

  // Pre-configured scan targets for infinite recycling
  const getBaseScanTargets = (sys: SystemType): Omit<ScanTarget, 'scanned' | 'x' | 'y' | 'z'>[] => {
    const contamination = contaminationLevelRef.current || 0;
    const isCorrupted = contamination > 50;

    switch (sys) {
      case 'cardiovascular':
        return isCorrupted ? [
          { id: 'cv_rbc_cluster', name: '산소 결핍 찌그러진 혈전 군집', description: 'O2-Starved RBC Clot', hint: '산소 운송 능력을 상실하고 까맣게 산패되어 서로 뒤엉켜 혈관을 막기 일보 직전인 괴사성 적혈구 뭉치입니다.' },
          { id: 'cv_macrophage', name: '독소에 중독된 괴사성 대식세포', description: 'Necrotic Macrophage', hint: '주입된 화학 독극물과 타르를 무리하게 포식하다가 분해 한계를 넘어 시꺼멓게 파열해가는 면역세포입니다.' },
          { id: 'cv_plaque', name: '석회화된 파열성 동맥경화 플라크', description: 'Calcified Ruptured Plaque', hint: '오염 물질 축적으로 동맥벽 격막이 터지기 직전입니다. 혈류를 영구 차단하여 뇌경색을 야기할 수 있는 일류 폭탄입니다.' },
          { id: 'cv_stent', name: '독소 타르에 부식된 의료 스텐트', description: 'Corroded Medical Stent', hint: '혈관을 넓히기 위해 삽입된 금속망이 침전된 니코틴과 중금속 타르에 절어 완전히 부식되어 찌그러졌습니다.' },
        ] : [
          { id: 'cv_rbc_cluster', name: '산소 포화 적혈구 군집', description: 'O2-Saturated RBC Cluster', hint: '산소를 실은 적혈구들이 세포로 가기 위해 줄지어 이동하고 있습니다.' },
          { id: 'cv_macrophage', name: '활성 대식세포 분화체', description: 'Active Macrophage', hint: '체내 침투한 이물질이나 바이러스를 식세포 작용으로 집어삼키는 거대 면역세포입니다.' },
          { id: 'cv_plaque', name: '동맥 경화성 지질 플라크', description: 'Arterial Plaque', hint: '혈관 벽에 콜레스테롤이 쌓여 혈관이 좁아지는 현상입니다. 스캔 후 확장 시술이 필요할 수 있습니다.' },
          { id: 'cv_stent', name: '자가확장형 스텐트 그물망', description: 'Intravascular Stent', hint: '협착된 혈관을 물리적으로 넓혀 혈류를 원활히 유지해주는 정밀 의료 장치입니다.' },
        ];
      case 'digestive':
        return isCorrupted ? [
          { id: 'dg_pit', name: '천공성 위궤양 파열 틈새', description: 'Perforated Gastric Ulcer', hint: '뮤신 코팅막이 완전히 해체되어 스스로가 뿜어내는 염산과 유독성 아세트알데히드에 위벽 세포가 썩어 들어가는 상처 구멍입니다.' },
          { id: 'dg_chyme', name: '아세트알데히드 발효 독성 미즙', description: 'Acetaldehyde Toxic Slurry', hint: '폭음된 알코올의 1차 산물인 맹독성 아세트알데히드가 마구 끓어오르며 장벽 뉴런에 치명적인 신경 독성을 살포합니다.' },
          { id: 'dg_villi', name: '소장 점막 융털 부식 괴사지대', description: 'Necrosed Intestinal Villi', hint: '주입된 화학 용제 성분에 닿아 융털의 인지질 이중막이 일괄 용해되며 다발적인 출혈이 관찰되는 융단 구역입니다.' },
          { id: 'dg_lacto', name: '전멸 위기 유산균 사체 무덤', description: 'Exterminated Microbiome Corpse', hint: '오염 물질과 유해 화학 액에 몰살당해 세포외막이 터진 채 허옇게 흐물거리는 유익균들의 불쌍한 사체 더미입니다.' },
        ] : [
          { id: 'dg_pit', name: '위점막 위샘 구멍', description: 'Gastric Pit Aperture', hint: '강력한 단백질 분해 효소인 펩신과 위산(HCl)을 분비하는 위벽의 미세 선 구조입니다.' },
          { id: 'dg_chyme', name: '반소화 미즙 현탁액', description: 'Chyme Suspension', hint: '위장관 운동과 위액에 의해 죽처럼 잘게 분쇄된 음식물 입자 덩어리입니다.' },
          { id: 'dg_villi', name: '소장 점막 융털 돌기', description: 'Intestinal Villi Carpet', hint: '영양소 흡수 면적을 수천 배 넓혀주는 소장 안쪽 벽의 카펫 형태 미세 주름 구조입니다.' },
          { id: 'dg_lacto', name: '유산균(락토바실러스) 군집', description: 'Beneficial Gut Microbiome', hint: '위장의 면역력을 돕고 소화를 원활하게 해주는 유익한 프로바이오틱스 박테리아입니다.' },
        ];
      case 'respiratory':
        return isCorrupted ? [
          { id: 'rp_cilia', name: '타르에 마비되어 정지한 섬모망', description: 'Tar-Paralyzed Dead Cilia', hint: '걸쭉한 니코틴 점액 타르가 도배되어 청소 빗질 운동을 완전히 멈추고 굳어버린, 숨 막히는 슬러지 벽면입니다.' },
          { id: 'rp_alveoli', name: '타르 침전 및 섬유화된 허파꽈리', description: 'Tar-Infiltrated Fibrotic Alveoli', hint: '원래 예쁜 선홍색이어야 할 폐포 구역이 시커멓게 그을려 석탄처럼 쪼그라들었으며 신축 기능이 소실되었습니다.' },
          { id: 'rp_capture', name: '일산화탄소(CO) 헤모글로빈 탈취', description: 'Carbon Monoxide Suffocation', hint: '산소보다 무려 200배 결합력이 강한 일산화탄소가 헤모글로빈을 강제 탈취하여 전신을 질식 사태로 만드는 무자비한 현장입니다.' },
          { id: 'rp_dust_macro', name: '플라스틱에 찔려 파열된 대식세포', description: 'Plastic-Punctured Dust Cell', hint: '초미세 먼지와 뾰족한 플라스틱 나노 입자들을 한계까지 우겨 먹다 세포막이 날카롭게 찢겨 피를 쏟아내며 괴사한 청소부 세포입니다.' },
        ] : [
          { id: 'rp_cilia', name: '기도 상피세포 섬모망', description: 'Bronchial Epithelial Cilia', hint: '외부에서 들어온 가래와 미세먼지를 기관지 밖으로 밀어내기 위해 쓸어넘기는 필터 장치입니다.' },
          { id: 'rp_alveoli', name: '모세혈관 포위형 폐포낭', description: 'Capillary Alveolar Sac', hint: '두께가 단 한 개의 세포막에 불과해 가스 교환(O2 수취, CO2 방출)이 순식간에 이루어지는 허파꽈리입니다.' },
          { id: 'rp_capture', name: '헤모글로빈 산소 결합 현장', description: 'Hemoglobin O2 Binding', hint: '적혈구 속 철 함유 단백질인 헤모글로빈이 폐포장에서 들어온 산소 분자와 강력하게 결합하는 순간입니다.' },
          { id: 'rp_dust_macro', name: '폐포 먼지 제거 대식세포', description: 'Alveolar Dust Cell', hint: '호흡을 통해 폐포 깊숙이 침입한 초미세 유해 입자들을 먹어 치워 폐를 청결히 유지하는 청소부 세포입니다.' },
        ];
      case 'nervous':
        return isCorrupted ? [
          { id: 'nv_cleft', name: '화학 마약성 과부하 폭주 시냅스', description: 'Chemically Hijacked Synapse', hint: '강제 주입된 신경 독성 활성 물질로 인해 도파민과 아드레날린이 수용체 틈새에 비정상 홍수를 이루며 뇌 회로를 불태우는 중입니다.' },
          { id: 'nv_node', name: '합선되어 방전 중인 랑비에 마디', description: 'Short-Circuited Ranvier Node', hint: '전위 제어 메커니즘 붕괴로 전류가 사방으로 새어나가 전신 마비와 자율신경 오작동을 촉발시키는 스파크 누전 구역입니다.' },
          { id: 'nv_myelin', name: '수초가 녹아 단선된 축삭돌기', description: 'Demyelinated Severed Axon', hint: '수초 지질 보호막이 부식 분해되어 속살 전선이 통째로 밖으로 노출되었고 신호 흐름이 완전히 단선된 절망적인 상태입니다.' },
          { id: 'nv_astrocyte', name: '장벽 붕괴로 아사 직전인 성상세포', description: 'Starving Toxic Astrocyte', hint: '뇌혈관 장벽(BBB) 무력화로 들어온 유독 물질 조각들에 직접 치여 사지가 갈가리 찢어진 채 신경 괴사 물질을 유포하는 별세포입니다.' },
        ] : [
          { id: 'nv_cleft', name: '시냅스 틈새 및 전달물질', description: 'Synaptic Cleft Junction', hint: '신경 자극이 다음 뉴런으로 전달될 때, 화학적 신호 물질이 방출되어 건너가는 20nm의 미세 갭입니다.' },
          { id: 'nv_node', name: '랑비에 마디 전기 도약', description: 'Node of Ranvier', hint: '축삭돌기의 수초 사이 빈 곳으로, 전기 신호가 미끄러지듯 도약 전도를 하여 속도를 100배 증가시킵니다.' },
          { id: 'nv_myelin', name: '축삭 보호막 수초초', description: 'Insulating Myelin Sheath', hint: '뉴런의 전선 피복 같은 역할을 하여 전기 신호가 누전되지 않고 뇌와 온몸으로 빠르게 달리도록 돕는 수초막입니다.' },
          { id: 'nv_astrocyte', name: '성상교세포 지지망', description: 'Star-Shaped Astrocyte', hint: '뇌혈관 장벽(BBB)을 형성하고 뉴런에 영양 공급 및 노폐물 배출을 돕는 별 모양의 핵심 신경교세포입니다.' },
        ];
    }
  };

  // Synchronize or generate active scan targets based on camera position
  const updateScanTargetsPool = (currentSystem: SystemType) => {
    const baseZ = cameraZRef.current;
    const baseTargets = getBaseScanTargets(currentSystem);
    
    // We will place 4 targets, spaced 120 units apart along the future path.
    // When the camera passes a target, we recycle it forward.
    const activePool: ScanTarget[] = [];
    
    for (let i = 0; i < baseTargets.length; i++) {
      const template = baseTargets[i];
      // Target Z starts at baseZ + 100 + i * 150
      // If camera has passed it, shift it forward by adding N * (length * 150)
      const spacing = 140;
      const cycleLength = baseTargets.length * spacing;
      let targetZ = 120 + i * spacing;
      
      // Calculate recycled position ahead of current camera
      while (targetZ < baseZ - 40) {
        targetZ += cycleLength;
      }

      const pCenter = getPathCenter(targetZ, currentSystem);
      
      // Give each target a slight offset from the exact path center to make steering fun
      const offsetX = Math.sin(i * 1.5) * 15;
      const offsetY = Math.cos(i * 1.5) * 12;

      activePool.push({
        ...template,
        scanned: false,
        x: pCenter.x + offsetX,
        y: pCenter.y + offsetY,
        z: targetZ,
      });
    }

    scanTargetsRef.current = activePool;
  };

  // Handle system switching or initial load
  useEffect(() => {
    initParticles(system);
    updateScanTargetsPool(system);
  }, [system]);

  // Set up Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set up Mouse look listeners on Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Normalize center-offset between -1.0 and 1.0
      const normX = (mouseX / rect.width) * 2 - 1;
      const normY = (mouseY / rect.height) * 2 - 1;

      mouseHoverPosRef.current = { x: normX, y: normY };
      isMouseInsideRef.current = true;
    }

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;

      previousMouseRef.current = { x: e.clientX, y: e.clientY };

      // Update pitch and yaw refs (yaw: Y axis look, pitch: X axis look)
      // Yaw should rotate camera looking left/right, Pitch for up/down
      const sensitivity = 0.0035;
      pitchRef.current = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, pitchRef.current + deltaY * sensitivity));
      yawRef.current = yawRef.current - deltaX * sensitivity;
    }
  };

  const handleMouseEnter = () => {
    isMouseInsideRef.current = true;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    isMouseInsideRef.current = false;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Main 3D Simulation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize smoothly
    const handleResize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      canvas.width = rect?.width || 800;
      canvas.height = rect?.height || 500;
    };
    handleResize();

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Colors and styling per system
    const getSystemWallColors = (sys: SystemType, t: number, z: number) => {
      switch (sys) {
        case 'cardiovascular': {
          // Dynamic organic pulsing reds
          const pulse = Math.sin(t * 0.003 + z * 0.01) * 20;
          return {
            fill: `rgba(${120 + pulse}, ${20 + pulse * 0.5}, ${25 + pulse * 0.3}, 0.82)`,
            stroke: `rgba(239, 68, 68, ${0.4 + Math.sin(t * 0.006) * 0.1})`,
            grid: 'rgba(248, 113, 113, 0.25)',
          };
        }
        case 'digestive': {
          // Fleshy warm yellows, pinks, mucosal membranes
          const peristalsis = Math.sin(t * 0.002 + z * 0.01) * 15;
          return {
            fill: `rgba(${165 + peristalsis}, ${115 + peristalsis * 0.5}, ${80}, 0.8)`,
            stroke: 'rgba(234, 179, 8, 0.35)',
            grid: 'rgba(254, 240, 138, 0.2)',
          };
        }
        case 'respiratory': {
          // Gaseous deep blue, teals
          const breath = Math.sin(t * 0.001) * 10;
          return {
            fill: `rgba(${15 + breath}, ${55 + breath * 1.5}, ${70 + breath * 1.2}, 0.85)`,
            stroke: 'rgba(14, 165, 233, 0.4)',
            grid: 'rgba(56, 189, 248, 0.25)',
          };
        }
        case 'nervous': {
          // Deep electric cosmic space
          const electric = Math.sin(t * 0.015 + z * 0.02) > 0.9 ? 120 : 0;
          return {
            fill: `rgba(${15 + electric * 0.2}, ${10 + electric * 0.3}, ${35 + electric}, 0.9)`,
            stroke: 'rgba(167, 139, 250, 0.45)',
            grid: 'rgba(196, 181, 253, 0.3)',
          };
        }
      }
    };

    let lastTime = 0;

    const render = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      // 1. Physics: update cameraZ based on speed
      const actualSpeed = speedRef.current * (viewModeRef.current === 'autopilot' ? 1 : 1.3);
      cameraZRef.current += actualSpeed * 0.25;

      // 2. Manual Keyboard Steering WASD or Autopilot adjustment
      if (viewModeRef.current === 'manual') {
        const steeringSpeed = 1.2;
        let dx = 0;
        let dy = 0;

        if (keysPressedRef.current['a'] || keysPressedRef.current['arrowleft']) dx -= steeringSpeed;
        if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) dx += steeringSpeed;
        if (keysPressedRef.current['w'] || keysPressedRef.current['arrowup']) dy -= steeringSpeed;
        if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) dy += steeringSpeed;

        // Mouse-based steering if mouse is inside canvas
        if (isMouseInsideRef.current) {
          const limit = getRingRadius(cameraZRef.current, system) - 18;
          const mouseTargetX = mouseHoverPosRef.current.x * limit;
          const mouseTargetY = mouseHoverPosRef.current.y * limit;
          
          // Smoothly drift towards mouse targets
          camControlXRef.current += (mouseTargetX - camControlXRef.current) * 0.05;
          camControlYRef.current += (mouseTargetY - camControlYRef.current) * 0.05;
        }

        // Add keyboard input directly on top
        camControlXRef.current += dx;
        camControlYRef.current += dy;

        // Clamp steering to remain inside tunnel boundaries
        const limit = getRingRadius(cameraZRef.current, system) - 15;
        camControlXRef.current = Math.max(-limit, Math.min(limit, camControlXRef.current));
        camControlYRef.current = Math.max(-limit, Math.min(limit, camControlYRef.current));
      } else {
        // Autopilot: steer slowly back to the center of the path
        camControlXRef.current *= 0.94;
        camControlYRef.current *= 0.94;
      }

      // Smoothly tilt view/vision (yaw & pitch) towards the mouse pointer position
      if (isMouseInsideRef.current && !isDraggingRef.current) {
        const targetYaw = mouseHoverPosRef.current.x * 0.95; // Follow mouse direction precisely (non-inverted)
        const targetPitch = mouseHoverPosRef.current.y * 0.65; // Follow mouse pitch precisely

        // Smoothly interpolate
        yawRef.current += (targetYaw - yawRef.current) * 0.12;
        pitchRef.current += (targetPitch - pitchRef.current) * 0.12;
      } else if (!isMouseInsideRef.current && !isDraggingRef.current) {
        // Smoothly return view direction back to center when cursor is not inside the canvas
        yawRef.current += (0 - yawRef.current) * 0.08;
        pitchRef.current += (0 - pitchRef.current) * 0.08;
      }

      // Update text coordinates HUD in real-time directly on the DOM
      if (coordXTextRef.current) {
        coordXTextRef.current.textContent = camControlXRef.current.toFixed(1);
      }
      if (coordYTextRef.current) {
        coordYTextRef.current.textContent = camControlYRef.current.toFixed(1);
      }

      // Sync scan targets dynamically
      updateScanTargetsPool(system);

      // 3. Clear canvas with depth backdrop gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        10,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8
      );
      
      if (system === 'cardiovascular') {
        gradient.addColorStop(0, '#3f060a');
        gradient.addColorStop(1, '#0c0002');
      } else if (system === 'digestive') {
        gradient.addColorStop(0, '#422006');
        gradient.addColorStop(1, '#0f0500');
      } else if (system === 'respiratory') {
        gradient.addColorStop(0, '#022c22');
        gradient.addColorStop(1, '#020617');
      } else {
        gradient.addColorStop(0, '#1e1b4b');
        gradient.addColorStop(1, '#030712');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starry/molecular space dust in the background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 20; i++) {
        const starX = (Math.sin(time * 0.0001 + i) * 0.5 + 0.5) * canvas.width;
        const starY = (Math.cos(time * 0.0001 + i * 2) * 0.5 + 0.5) * canvas.height;
        ctx.fillRect(starX, starY, 1.5, 1.5);
      }

      // Get camera relative offset
      const curCamCenter = getPathCenter(cameraZRef.current, system);

      // Educational "Drunk Sway" effect representing alcohol's motor impairment
      const drinking = drinkingLevelRef.current || 0;
      let swayX = 0;
      let swayY = 0;
      if (drinking > 10) {
        swayX = Math.sin(time * 0.001) * (drinking * 0.22);
        swayY = Math.cos(time * 0.0012) * (drinking * 0.18);
      }

      const camX = curCamCenter.x + camControlXRef.current + swayX;
      const camY = curCamCenter.y + camControlYRef.current + swayY;
      const camZ = cameraZRef.current;

      const yawVal = yawRef.current;
      const pitchVal = pitchRef.current;

      // Project 3D vector to 2D Screen
      const projectPoint = (p: Vector3D) => {
        // relative to camera
        const rx = p.x - camX;
        const ry = p.y - camY;
        const rz = p.z - camZ;

        // 3D rotation: Yaw around Y-axis
        const x1 = rx * Math.cos(yawVal) - rz * Math.sin(yawVal);
        const z1 = rx * Math.sin(yawVal) + rz * Math.cos(yawVal);

        // 3D rotation: Pitch around X-axis
        const y2 = ry * Math.cos(pitchVal) - z1 * Math.sin(pitchVal);
        const z2 = ry * Math.sin(pitchVal) + z1 * Math.cos(pitchVal);

        if (z2 < 0.1) {
          return { x: 0, y: 0, zDepth: z2, valid: false };
        }

        const scale = FOV / z2;
        const screenX = canvas.width / 2 + x1 * scale;
        const screenY = canvas.height / 2 + y2 * scale;

        return { x: screenX, y: screenY, zDepth: z2, valid: true };
      };

      // 4. Generate all tunnel rings & project their vertices
      const rings: {
        z: number;
        radius: number;
        center: Vector3D;
        projectedCenter: { x: number; y: number; zDepth: number; valid: boolean };
        vertices: Vector3D[];
        projectedVertices: { x: number; y: number; zDepth: number; valid: boolean }[];
      }[] = [];

      const baseZ = Math.floor(camZ / SEGMENT_SPACING) * SEGMENT_SPACING;

      for (let i = 0; i < NUM_RINGS; i++) {
        const rZ = baseZ + i * SEGMENT_SPACING;
        if (rZ < camZ - 5) continue; // skip rings slightly behind camera

        const rRad = getRingRadius(rZ, system);
        const rCenter = getPathCenter(rZ, system);
        const projCenter = projectPoint(rCenter);

        const rVertices: Vector3D[] = [];
        const rProjVertices: { x: number; y: number; zDepth: number; valid: boolean }[] = [];

        // Generate 16 vertices around the circle
        const numSegments = 16;
        for (let j = 0; j < numSegments; j++) {
          const angle = j * ((Math.PI * 2) / numSegments);
          
          // Inject minor organic wall waves based on z and time
          let ripple = 0;
          if (system === 'cardiovascular') {
            ripple = Math.sin(j * 3 + rZ * 0.05 + time * 0.005) * 1.5;
          } else if (system === 'digestive') {
            ripple = Math.sin(j * 2 + rZ * 0.03 + time * 0.003) * 3;
          } else {
            ripple = Math.sin(j * 4 + rZ * 0.1) * 1.0;
          }

          const radialDist = rRad + ripple;

          const vx = rCenter.x + Math.cos(angle) * radialDist;
          const vy = rCenter.y + Math.sin(angle) * radialDist;
          const vz = rZ;

          const pVertex = { x: vx, y: vy, z: vz };
          rVertices.push(pVertex);
          rProjVertices.push(projectPoint(pVertex));
        }

        rings.push({
          z: rZ,
          radius: rRad,
          center: rCenter,
          projectedCenter: projCenter,
          vertices: rVertices,
          projectedVertices: rProjVertices,
        });
      }

      // 5. Gather quads (tunnel polygons) and sort for Z-ordering (Painter's algorithm)
      interface Quad {
        p1: { x: number; y: number };
        p2: { x: number; y: number };
        p3: { x: number; y: number };
        p4: { x: number; y: number };
        depth: number;
        ringIndex: number;
        vertexIndex: number;
        valid: boolean;
      }

      const quads: Quad[] = [];

      for (let i = 0; i < rings.length - 1; i++) {
        const ringA = rings[i];
        const ringB = rings[i + 1];
        const numS = ringA.vertices.length;

        for (let j = 0; j < numS; j++) {
          const pA1 = ringA.projectedVertices[j];
          const pA2 = ringA.projectedVertices[(j + 1) % numS];
          const pB2 = ringB.projectedVertices[(j + 1) % numS];
          const pB1 = ringB.projectedVertices[j];

          const valid = pA1.valid && pA2.valid && pB1.valid && pB2.valid;
          const avgDepth = (pA1.zDepth + pA2.zDepth + pB1.zDepth + pB2.zDepth) / 4;

          quads.push({
            p1: pA1,
            p2: pA2,
            p3: pB2,
            p4: pB1,
            depth: avgDepth,
            ringIndex: i,
            vertexIndex: j,
            valid,
          });
        }
      }

      // Sort polygons: Far depth drawn FIRST, near depth drawn LATER
      quads.sort((a, b) => b.depth - a.depth);

      // 6. Draw tunnel polygons!
      quads.forEach((q) => {
        if (!q.valid) return;

        const colors = getSystemWallColors(system, time, rings[q.ringIndex].z);

        // Calculate fog factor (fade to black in distance)
        const maxDepth = VIEW_DISTANCE - 40;
        const fogFactor = Math.max(0, Math.min(1, q.depth / maxDepth));
        
        ctx.beginPath();
        ctx.moveTo(q.p1.x, q.p1.y);
        ctx.lineTo(q.p2.x, q.p2.y);
        ctx.lineTo(q.p3.x, q.p3.y);
        ctx.lineTo(q.p4.x, q.p4.y);
        ctx.closePath();

        // Base fill color with distance fog
        ctx.fillStyle = colors.fill;
        ctx.fill();

        // Stroke segment grids
        if (q.vertexIndex % 2 === 0) {
          ctx.strokeStyle = colors.stroke;
          ctx.lineWidth = 1 * (1 - fogFactor);
          ctx.stroke();
        }

        // ==========================================
        // 🔬 REALISTIC TOXIN PATHOLOGY VISUAL EFFECTS
        // ==========================================
        const smoking = smokingLevelRef.current || 0;
        const drinking = drinkingLevelRef.current || 0;

        // 1. Tar Stains from Smoking (Sticky black-brown sludge on the vessel/membrane walls)
        if (smoking > 5) {
          // Semi-deterministic noise to map tar placements along the rings
          const tarHash = Math.sin(q.ringIndex * 7.1 + q.vertexIndex * 3.3) * 1000;
          const tarRnd = tarHash - Math.floor(tarHash);
          
          if (tarRnd * 100 < smoking) {
            // Find center of current wall polygon
            const cx = (q.p1.x + q.p2.x + q.p3.x + q.p4.x) / 4;
            const cy = (q.p1.y + q.p2.y + q.p3.y + q.p4.y) / 4;
            const size = (rings[q.ringIndex].radius * (FOV / q.depth)) * 0.16 * (0.5 + tarRnd * 0.8);

            ctx.save();
            ctx.globalAlpha = 1 - fogFactor;
            // Sticky organic tar brown-black color
            ctx.fillStyle = `rgba(${35 + tarRnd * 15}, ${15 + tarRnd * 10}, 8, ${0.5 + (smoking / 100) * 0.45})`;
            ctx.beginPath();
            const points = 6;
            for (let sp = 0; sp < points; sp++) {
              const angle = (sp * Math.PI * 2) / points;
              // Irregular wiggling edge (slime effect)
              const dist = size * (0.8 + Math.sin(time * 0.003 + sp + q.ringIndex) * 0.2);
              const tx = cx + Math.cos(angle) * dist;
              const ty = cy + Math.sin(angle) * dist;
              if (sp === 0) ctx.moveTo(tx, ty);
              else ctx.lineTo(tx, ty);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }

        // 2. Acid Burn & Dissolution from Alcohol (Bubbling amber/yellow-green cracks on cellular lining)
        if (drinking > 5) {
          const acidHash = Math.cos(q.ringIndex * 11.3 + q.vertexIndex * 4.7) * 1000;
          const acidRnd = acidHash - Math.floor(acidHash);

          if (acidRnd * 100 < drinking) {
            ctx.save();
            ctx.globalAlpha = 1 - fogFactor;
            // Glowing corroding acid edge
            ctx.strokeStyle = `rgba(234, 179, 8, ${0.45 + (drinking / 100) * 0.55})`;
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = (drinking / 100) * 8 * (1 - fogFactor);
            ctx.lineWidth = (1.5 + acidRnd * 3.5) * (1 - q.depth / VIEW_DISTANCE);
            ctx.beginPath();
            ctx.moveTo(q.p1.x, q.p1.y);
            ctx.lineTo(q.p2.x, q.p2.y);
            ctx.stroke();

            // Sizzling gaseous bubbles coming from the acid burn
            if (Math.random() < 0.08) {
              ctx.fillStyle = 'rgba(253, 224, 71, 0.75)';
              ctx.beginPath();
              ctx.arc(
                q.p1.x + (Math.random() - 0.5) * 12, 
                q.p1.y - Math.random() * 20, 
                (Math.random() * 3 + 1.2) * (1 - fogFactor), 
                0, 
                Math.PI * 2
              );
              ctx.fill();
            }
            ctx.restore();
          }
        }

        // 3. Respiratory Cilia Hairs (Lungs self-cleaning cilia that are paralyzed & blackened by smoking tar)
        if (system === 'respiratory') {
          const isParalyzed = smoking > 30;
          const isSeverelyDamaged = smoking > 60;
          
          const angle = q.vertexIndex * ((Math.PI * 2) / 16);
          const hairLen = (isSeverelyDamaged ? 4 : isParalyzed ? 6 : 9) * (FOV / q.depth);
          
          // Healthy cilia wave rapidly to sweep out foreign matter. Tar paralyzes them!
          const wave = isParalyzed ? 0 : Math.sin(time * 0.016 + q.ringIndex) * 0.35;
          const hairAngle = angle + Math.PI + wave; // point inward towards tunnel center

          const hx1 = q.p1.x;
          const hy1 = q.p1.y;
          const hx2 = q.p1.x + Math.cos(hairAngle) * hairLen;
          const hy2 = q.p1.y + Math.sin(hairAngle) * hairLen;

          ctx.save();
          ctx.globalAlpha = 1 - fogFactor;
          if (isSeverelyDamaged) {
            // Sickly necrotic charred black/brown cilia
            ctx.strokeStyle = `rgba(45, 30, 20, ${0.9 * (1 - q.depth / VIEW_DISTANCE)})`;
            ctx.lineWidth = 0.8;
          } else if (isParalyzed) {
            // Gray-brown paralyzed cilia
            ctx.strokeStyle = `rgba(115, 105, 90, ${0.8 * (1 - q.depth / VIEW_DISTANCE)})`;
            ctx.lineWidth = 1.2;
          } else {
            // Healthy energetic cyan cilia
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.75 * (1 - q.depth / VIEW_DISTANCE)})`;
            ctx.lineWidth = 1.6;
          }
          ctx.beginPath();
          ctx.moveTo(hx1, hy1);
          ctx.lineTo(hx2, hy2);
          ctx.stroke();
          ctx.restore();
        }

        // Draw structural cartilage rings (respiratory system) or electrical neural networks (nervous system)
        if (system === 'respiratory' && q.ringIndex % 3 === 0 && q.vertexIndex === 0) {
          const rCenter = rings[q.ringIndex]?.projectedCenter;
          if (rCenter && rCenter.valid && rCenter.zDepth > 0.1) {
            ctx.beginPath();
            ctx.arc(rCenter.x, rCenter.y, rings[q.ringIndex].radius * (FOV / rCenter.zDepth), 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
            ctx.lineWidth = 3 * (1 - fogFactor);
            ctx.stroke();
          }
        }

        // Dark depth overlay overlay
        if (fogFactor > 0.01) {
          ctx.fillStyle = `rgba(0, 0, 0, ${fogFactor * 0.95})`;
          ctx.beginPath();
          ctx.moveTo(q.p1.x, q.p1.y);
          ctx.lineTo(q.p2.x, q.p2.y);
          ctx.lineTo(q.p3.x, q.p3.y);
          ctx.lineTo(q.p4.x, q.p4.y);
          ctx.closePath();
          ctx.fill();
        }
      });

      // 7. Render dynamic scan targets
      const currentTargets = scanTargetsRef.current;
      currentTargets.forEach((target) => {
        const proj = projectPoint(target);
        if (!proj.valid) return;

        // Target depth-scaling size
        const radiusLimit = getRingRadius(target.z, system);
        const scale = FOV / proj.zDepth;
        const size = Math.max(8, Math.min(35, 12 * scale));

        const distanceToTarget = target.z - camZ;

        // Draw targets in front, but fade out if too close or too far
        if (distanceToTarget > 0 && distanceToTarget < VIEW_DISTANCE) {
          const opacity = distanceToTarget < 30 
            ? (distanceToTarget / 30) // fade out if very close (behind cockpit)
            : Math.max(0, Math.min(1, (VIEW_DISTANCE - distanceToTarget) / 100));

          ctx.save();
          ctx.globalAlpha = opacity;

          const isSelected = activeTargetRef.current?.id === target.id;
          const isScanningRange = distanceToTarget < 110 && distanceToTarget > 20;

          // Holographic color: blinking green for scan lock-on
          const blink = Math.sin(time * 0.01) * 0.3 + 0.7;
          ctx.strokeStyle = isSelected 
            ? `rgba(239, 68, 68, ${blink})` // Red if active scanned target
            : isScanningRange 
              ? `rgba(34, 197, 94, ${blink})` // Blinking Green if lock-on
              : 'rgba(56, 189, 248, 0.7)'; // Cyan default

          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 12;

          // Draw holographic crosshair/hexagon container
          ctx.beginPath();
          ctx.lineWidth = isSelected ? 3 : 1.5;
          const sides = 6;
          for (let s = 0; s <= sides; s++) {
            const angle = (s * Math.PI * 2) / sides + time * 0.001;
            const sx = proj.x + Math.cos(angle) * size;
            const sy = proj.y + Math.sin(angle) * size;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();

          // Draw central dot
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, size * 0.15, 0, Math.PI * 2);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();

          // Label text
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(target.name, proj.x, proj.y - size - 8);

          // Sub-label for scanning range state
          ctx.font = '9px monospace';
          ctx.fillStyle = isScanningRange ? '#4ade80' : '#38bdf8';
          const rangeText = isScanningRange 
            ? `LOCK-ON [${Math.floor(distanceToTarget)}m] (Click to scan)` 
            : `APPROACHING [${Math.floor(distanceToTarget)}m]`;
          ctx.fillText(rangeText, proj.x, proj.y + size + 14);

          ctx.restore();
        }
      });

      // 8. Update & Draw Floating Particles (cells, enzymes, electricity)
      const particles = particlesRef.current;
      particles.forEach((p) => {
        // Move particle
        p.position.x += p.velocity.x;
        p.position.y += p.velocity.y;
        p.position.z += p.velocity.z;

        // If particle goes behind camera, recycle it to the back
        if (p.position.z < camZ - 5) {
          p.position.z = camZ + VIEW_DISTANCE + Math.random() * 80;
          const rRad = getRingRadius(p.position.z, system) - 8;
          const pathCenter = getPathCenter(p.position.z, system);
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * rRad;

          p.position.x = pathCenter.x + Math.cos(angle) * dist;
          p.position.y = pathCenter.y + Math.sin(angle) * dist;
          p.type = getRandomParticleType(system);
        }

        const proj = projectPoint(p.position);
        if (!proj.valid) return;

        const distanceToParticle = p.position.z - camZ;
        if (distanceToParticle < 0 || distanceToParticle > VIEW_DISTANCE) return;

        const fogFactor = Math.max(0, Math.min(1, distanceToParticle / VIEW_DISTANCE));
        const scale = FOV / proj.zDepth;
        const radius = Math.max(0.5, p.size * scale);

        ctx.save();
        ctx.globalAlpha = 1 - fogFactor;

        // Custom render patterns per particle type
        if (p.type === 'rbc') {
          // Biconcave Red Blood Cell disc
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = radius * 0.15;
          ctx.beginPath();
          ctx.ellipse(proj.x, proj.y, radius, radius * 0.65, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner shaded dip of the biconcave cell
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.ellipse(proj.x, proj.y, radius * 0.5, radius * 0.3, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'wbc') {
          // White Blood Cells: fluffy immune sphere
          const wbcPulse = Math.sin((p.pulse || 0) + time * 0.005) * 1.2 + radius;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = radius * 0.4;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, wbcPulse * 1.1, 0, Math.PI * 2);
          ctx.fill();

          // Spikes/receptors on WBC wall
          ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
          ctx.lineWidth = radius * 0.1;
          for (let sp = 0; sp < 8; sp++) {
            const angle = (sp * Math.PI) / 4 + time * 0.002;
            ctx.beginPath();
            ctx.moveTo(proj.x, proj.y);
            ctx.lineTo(proj.x + Math.cos(angle) * wbcPulse * 1.3, proj.y + Math.sin(angle) * wbcPulse * 1.3);
            ctx.stroke();
          }
        } else if (p.type === 'platelet') {
          // Platelet: purple crystalline fragment
          ctx.fillStyle = '#c084fc';
          ctx.strokeStyle = '#6b21a8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          const sides = 5;
          for (let s = 0; s <= sides; s++) {
            const angle = (s * Math.PI * 2) / sides;
            const sx = proj.x + Math.cos(angle) * radius;
            const sy = proj.y + Math.sin(angle) * radius * 0.7;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.fill();
          ctx.stroke();
        } else if (p.type === 'cholesterol') {
          // Cholesterol clump
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (p.type === 'acid') {
          // Gastric acid droplets: neon green bubbles
          ctx.fillStyle = 'rgba(132, 204, 22, 0.75)';
          ctx.shadowColor = '#84cc16';
          ctx.shadowBlur = radius * 0.5;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
          ctx.fill();

          // Shiny highlights
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(proj.x - radius * 0.3, proj.y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'o2') {
          // Oxygen molecule: O2 (dual interconnected red/cyan sphere)
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(proj.x - radius * 0.45, proj.y, radius * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(proj.x + radius * 0.45, proj.y, radius * 0.65, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'co2') {
          // Carbon Dioxide: CO2 (C center, two O sides)
          ctx.fillStyle = '#94a3b8'; // Carbon
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0284c7'; // Oxygen side 1
          ctx.beginPath();
          ctx.arc(proj.x - radius * 0.75, proj.y, radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(proj.x + radius * 0.75, proj.y, radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'action_potential') {
          // Spark electric pulses in the brain
          const length = radius * 2.5;
          ctx.strokeStyle = '#c4b5fd';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = '#8b5cf6';
          ctx.shadowBlur = radius * 0.7;
          ctx.beginPath();
          ctx.moveTo(proj.x - length * 0.5, proj.y + (Math.random() - 0.5) * radius * 0.4);
          ctx.lineTo(proj.x, proj.y + (Math.random() - 0.5) * radius * 1.5);
          ctx.lineTo(proj.x + length * 0.5, proj.y + (Math.random() - 0.5) * radius * 0.4);
          ctx.stroke();
        } else if (p.type === 'toxin_virus') {
          // 1) Spiky purple pathogen virus
          ctx.fillStyle = '#a21caf'; // purple core
          ctx.strokeStyle = '#f43f5e'; // red spikes
          ctx.lineWidth = radius * 0.15;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // draw 6 pathogen spikes
          for (let sp = 0; sp < 6; sp++) {
            const angle = (sp * Math.PI) / 3 + time * 0.003;
            ctx.beginPath();
            ctx.moveTo(proj.x + Math.cos(angle) * radius * 0.7, proj.y + Math.sin(angle) * radius * 0.7);
            ctx.lineTo(proj.x + Math.cos(angle) * radius * 1.4, proj.y + Math.sin(angle) * radius * 1.4);
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = radius * 0.2;
            ctx.stroke();

            // Spike head
            ctx.beginPath();
            ctx.arc(proj.x + Math.cos(angle) * radius * 1.4, proj.y + Math.sin(angle) * radius * 1.4, radius * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = '#f43f5e';
            ctx.fill();
          }
        } else if (p.type === 'toxin_tar') {
          // 2) Sticky amorphous tar clump
          ctx.fillStyle = '#0f172a'; // charcoal
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          // Draw irregular blob
          const tarPoints = 5;
          for (let sp = 0; sp < tarPoints; sp++) {
            const angle = (sp * Math.PI * 2) / tarPoints;
            const dist = radius * (0.8 + Math.sin(time * 0.002 + sp) * 0.35);
            const tx = proj.x + Math.cos(angle) * dist;
            const ty = proj.y + Math.sin(angle) * dist;
            if (sp === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (p.type === 'toxin_alcohol') {
          // 3) Toxic acetaldehyde gas bubbles
          ctx.fillStyle = 'rgba(217, 119, 6, 0.45)'; // Amber/gold bubble
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = radius * 0.1;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius * 1.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Shiny white highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.arc(proj.x - radius * 0.4, proj.y - radius * 0.4, radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'toxin_plastic') {
          // 4) Microplastic jagged shards (sharp triangles)
          ctx.fillStyle = '#06b6d4'; // bright cyan
          ctx.strokeStyle = '#0891b2';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(proj.x - radius * 1.1, proj.y + radius * 0.5);
          ctx.lineTo(proj.x + radius * 0.8, proj.y - radius * 0.9);
          ctx.lineTo(proj.x + radius * 0.3, proj.y + radius * 0.8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Generic neurotransmitters or nutrients
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 9. Draw interactive scanner crosshairs if a target is in front and close (lock-on mechanics)
      let currentLockOn: ScanTarget | null = null;
      currentTargets.forEach((target) => {
        const distanceToTarget = target.z - camZ;
        if (distanceToTarget > 15 && distanceToTarget < 110) {
          const proj = projectPoint(target);
          if (proj.valid) {
            // Check closeness to screen center (steering lock-on area)
            const dx = proj.x - canvas.width / 2;
            const dy = proj.y - canvas.height / 2;
            const centerDistance = Math.sqrt(dx * dx + dy * dy);
            
            if (centerDistance < canvas.width * 0.18) {
              currentLockOn = target;
            }
          }
        }
      });

      if (currentLockOn) {
        const target = currentLockOn as ScanTarget;
        const proj = projectPoint(target);
        if (proj.valid) {
          // Reticle ring
          ctx.save();
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 10;

          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, 45 + Math.sin(time * 0.015) * 4, 0, Math.PI * 2);
          ctx.stroke();

          // Lock on brackets
          const size = 35;
          ctx.beginPath();
          // top-left
          ctx.moveTo(canvas.width / 2 - size, canvas.height / 2 - size + 10);
          ctx.lineTo(canvas.width / 2 - size, canvas.height / 2 - size);
          ctx.lineTo(canvas.width / 2 - size + 10, canvas.height / 2 - size);
          // top-right
          ctx.moveTo(canvas.width / 2 + size, canvas.height / 2 - size + 10);
          ctx.lineTo(canvas.width / 2 + size, canvas.height / 2 - size);
          ctx.lineTo(canvas.width / 2 + size - 10, canvas.height / 2 - size);
          // bottom-left
          ctx.moveTo(canvas.width / 2 - size, canvas.height / 2 + size - 10);
          ctx.lineTo(canvas.width / 2 - size, canvas.height / 2 + size);
          ctx.lineTo(canvas.width / 2 - size + 10, canvas.height / 2 + size);
          // bottom-right
          ctx.moveTo(canvas.width / 2 + size, canvas.height / 2 + size - 10);
          ctx.lineTo(canvas.width / 2 + size, canvas.height / 2 + size);
          ctx.lineTo(canvas.width / 2 + size - 10, canvas.height / 2 + size);
          ctx.stroke();

          // Lock message
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('TARGET LOCKED', canvas.width / 2, canvas.height / 2 - size - 12);
          ctx.fillStyle = '#22c55e';
          ctx.fillText(`SCAN AREA [${target.name}]`, canvas.width / 2, canvas.height / 2 + size + 20);

          ctx.restore();
        }
      }

      // 10. Contamination Glitch overlay
      const contamination = contaminationLevelRef.current || 0;
      if (contamination > 30) {
        // Render periodic reddish/greenish flashes
        if (Math.random() < 0.12) {
          ctx.fillStyle = `rgba(239, 68, 68, ${0.04 + (contamination / 100) * 0.08})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Periodic glitch horizontal shifting bands
        if (contamination > 60 && Math.random() < 0.07) {
          const splitY = Math.random() * canvas.height;
          const shiftAmt = (Math.random() - 0.5) * 16 * (contamination / 100);
          const splitH = 8 + Math.random() * 25;
          try {
            const imgData = ctx.getImageData(0, splitY, canvas.width, splitH);
            ctx.putImageData(imgData, shiftAmt, splitY);
          } catch (e) {
            // Out of bounds safety
          }
        }

        // Draw HUD Alarm Banner for extreme contamination
        if (contamination >= 80 && Math.floor(time / 450) % 2 === 0) {
          ctx.save();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
          ctx.fillText('🚨 HIGH BIOTOXIN INTRUSION DETECTED 🚨', canvas.width / 2, 45);
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [system]);

  // Click handler to manually click scan targets on the canvas!
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const camZ = cameraZRef.current;
    const curCamCenter = getPathCenter(camZ, system);
    const camX = curCamCenter.x + camControlXRef.current;
    const camY = curCamCenter.y + camControlYRef.current;

    const yawVal = yawRef.current;
    const pitchVal = pitchRef.current;

    // Find if user clicked close to a projected scan target
    let clickedTarget: ScanTarget | null = null;
    let minDistance = 45; // clicking tolerance in pixels

    scanTargetsRef.current.forEach((target) => {
      const distanceToTarget = target.z - camZ;
      if (distanceToTarget > 0 && distanceToTarget < VIEW_DISTANCE) {
        // Projection math duplicated for clicking detection
        const rx = target.x - camX;
        const ry = target.y - camY;
        const rz = target.z - camZ;

        const x1 = rx * Math.cos(yawVal) - rz * Math.sin(yawVal);
        const z1 = rx * Math.sin(yawVal) + rz * Math.cos(yawVal);
        const y2 = ry * Math.cos(pitchVal) - z1 * Math.sin(pitchVal);
        const z2 = ry * Math.sin(pitchVal) + z1 * Math.cos(pitchVal);

        if (z2 > 0.1) {
          const scale = FOV / z2;
          const screenX = canvas.width / 2 + x1 * scale;
          const screenY = canvas.height / 2 + y2 * scale;

          const dist = Math.sqrt((screenX - clickX) ** 2 + (screenY - clickY) ** 2);
          if (dist < minDistance) {
            minDistance = dist;
            clickedTarget = target;
          }
        }
      }
    });

    if (clickedTarget) {
      onScanTarget(clickedTarget);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 overflow-hidden group select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* HUD Overlay Textures inside canvas frame */}
      <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur border border-slate-800/80 py-1.5 px-3 rounded text-[9px] font-mono pointer-events-none tracking-widest flex flex-col gap-1.5">
        <div className="text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          RADAR: SECTOR {system.toUpperCase()}_PROBE
        </div>
        <div className="text-[10px] text-slate-500 flex flex-col">
          <span>COORD X: <span ref={coordXTextRef} className="text-slate-300 font-bold">0.0</span>nm</span>
          <span>COORD Y: <span ref={coordYTextRef} className="text-slate-300 font-bold">0.0</span>nm</span>
        </div>
      </div>

      {/* Helpful HUD tips in bottom left */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1 pointer-events-none text-slate-400 font-mono text-[10px] bg-slate-950/80 backdrop-blur border border-slate-800 p-2.5 rounded-lg max-w-[280px]">
        <div className="text-emerald-400 font-bold mb-1">🎮 NAVIGATION CONTROLS</div>
        {viewMode === 'manual' ? (
          <>
            <div>• <span className="text-white">Mouse Move</span> : Steer & Look in Cursor Direction</div>
            <div>• <kbd className="bg-slate-800 px-1 rounded text-white font-sans">W</kbd> <kbd className="bg-slate-800 px-1 rounded text-white font-sans">A</kbd> <kbd className="bg-slate-800 px-1 rounded text-white font-sans">S</kbd> <kbd className="bg-slate-800 px-1 rounded text-white font-sans">D</kbd> / <span className="text-white">Arrows</span> : Adjust Position</div>
            <div>• <span className="text-white">Click Hexagons</span> : Instantly Scan Target</div>
          </>
        ) : (
          <>
            <div>• <span className="text-white">Autopilot engaged</span> : Nanobot self-driving</div>
            <div>• <span className="text-white">Mouse Move</span> : Look Around inside capsule</div>
            <div>• <span className="text-white">Click Hexagons</span> : Instantly Scan Target</div>
          </>
        )}
      </div>

      {/* Speed gauge overlay */}
      <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur border border-slate-800 p-3 rounded-lg text-right font-mono text-xs pointer-events-none flex flex-col gap-1">
        <div className="text-[10px] text-slate-500">VELOCITY ENGINE</div>
        <div className="text-cyan-400 text-lg font-bold tracking-wider">
          {((speed * 12.4) + (viewMode === 'autopilot' ? 10 : 0)).toFixed(1)} <span className="text-[10px] text-slate-400">nm/s</span>
        </div>
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${(speed / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
