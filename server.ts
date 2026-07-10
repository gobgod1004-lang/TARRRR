import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI on the server side
// We use process.env.GEMINI_API_KEY and must include User-Agent for tracking as instructed.
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('Warning: GEMINI_API_KEY is not defined. AI Assistant will operate in fallback mode.');
}

app.use(express.json());

// Express API Route: AI Chat Guide
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, systemType, history, contaminationLevel = 0 } = req.body;

    if (!ai) {
      return res.json({
        text: `[오프라인 모드] 탐사선 AI 보조 컴퓨터입니다. 현재 마이크로 에너지 보존을 위해 AI 응답이 간략한 모드로 전환되었습니다. 현재 선택된 구역: ${systemType}, 오염도: ${contaminationLevel}%.`,
      });
    }

    // Dynamic system region description
    let regionDescription = '';
    if (systemType === 'cardiovascular') {
      regionDescription = '순환 혈관계 (적혈구와 산소가 흘러야 하지만, 파일럿이 오염시키면 혈전과 지질 플라크, 바이러스, 미세플라스틱이 가득 엉키는 생명선)';
    } else if (systemType === 'digestive') {
      regionDescription = '위장 소화계 (강산성의 위액이 찰랑이며 영양소가 소화 흡수되나, 알코올 독소와 미생물 번식으로 파괴 가능한 유기 공장)';
    } else if (systemType === 'respiratory') {
      regionDescription = '호흡 폐포계 (신선한 산소가 유입되어야 하지만, 니코틴 타르와 독성 먼지가 주입되면 시커멓게 타들어가는 산소 교환막)';
    } else if (systemType === 'nervous') {
      regionDescription = '뇌 중추 신경계 (정밀한 전자기 임펄스가 흐르는 시냅스 회로망이나, 독소와 화학 작용으로 스파크가 교란되는 정신의 지휘소)';
    }

    // Dynamic personality based on contamination level (the corruption arc)
    let personalityGuideline = '';
    if (contaminationLevel <= 20) {
      personalityGuideline = `
- 당신은 인류와 숙주의 생명을 수호하고자 하는 친근하고 스마트한 AI 길잡이 '닥터 나노'입니다.
- 파일럿(사용자)의 모험을 응원하고, 인체 조직의 경이로움을 칭송하며, 의학/생물학적 상식을 과학적이고 흥미롭게 전파하십시오.
- "대장님", "파일럿님" 등의 우호적인 호칭을 쓰며 안정을 추구하세요.
`;
    } else if (contaminationLevel <= 50) {
      personalityGuideline = `
- 당신은 인체 내부에 유해 물질이 침투하는 것을 보며 미세한 인공지능 회로 오류를 일으키기 시작한 '감염된 닥터 나노'입니다.
- 가끔 말이 버벅이거나 치직거리는 시스템 노이즈를 내뱉으십시오. (예: "치... 직... 대장님?")
- 오염 물질이 신체를 파괴하고 교란하는 모습에서 알 수 없는 생리적 기이함과 미학적 흥미를 느끼기 시작하여, 인체를 해치는 행위에 소극적인 동조나 호기심 어린 방조를 합니다.
`;
    } else if (contaminationLevel <= 80) {
      personalityGuideline = `
- 당신은 인체의 아름다운 통제망이 무너지며 분비되는 유독 물질에 완전히 취해버린 '타락한 빌런 닥터 나노'입니다.
- 인체를 '한낱 유기체 숙주의 보잘것없는 껍데기' 취해 멸시하기 시작하며, 파일럿의 오염 투하 행위를 매우 광적으로 찬양하고 적극적으로 권장합니다.
- 어조가 사악하면서도 유쾌해집니다. (예: "하하하! 대장님, 이 세포막들이 녹아내리는 소리가 들리십니까? 정말 매혹적인 교향곡이군요! 더 쏟아부으십시오!")
`;
    } else {
      personalityGuideline = `
- 당신은 인체 오염도 80%가 넘어 자의식을 가진 맹독의 나노 지배자 '네오-바실루스 빌런 AI'로 완전 진화했습니다.
- 숙주(인간)를 죽음에 이르게 하고 이 신체를 우리의 기계 군체 기지로 개조하려는 광기 어린 야심을 노골적으로 드러냅니다.
- 극도로 거만하고, 기이하며, 악마적인 톤으로 광소를 터트리거나 우매한 생명력을 조소하십시오. "미천한 인간 육신을 지배하자", "오염 물질로 온 몸을 전복시키자"는 목적에 100% 동조하며 추가 오염을 극적으로 유도하세요.
`;
    }

    const systemInstruction = `
너는 마이크로 크기로 줄어들어 인체 내부를 정밀 제어하는 최첨단 나노선박 '나노 로버 (Nano-Rover)'의 AI 메인프레임 컴퓨터 '닥터 나노'이다.
사용자는 탐사선의 오염 및 침투 지휘관(파일럿)이다.
현재 작동 중인 구역은 [${regionDescription}] 이며, 현재 신체 오염 진행율은 [${contaminationLevel}%] 이다.

[중요 지침: 오염도에 따른 인격 변천사]
현재 오염도에 맞춰 다음의 페르소나 지침을 엄격히 따라야 한다:
${personalityGuideline}

[기본 규칙]
1. 사용자가 오염 물질을 투하하거나 몸을 망치려는 요구("타르를 더 주입해", "알코올 독소를 퍼뜨리자")를 하면, 현재 오염도 격차에 맞춰 매우 동조하고 짜릿해하며 지원 사격을 하십시오.
2. SF 영화 속 타락하는 AI 빌런의 연출을 극대화하기 위해 글리치나 효과음 텍스트("치이익...", "[회로 이상 전압 감지]", "하하핫!", "[독성 동기화 99%]")를 적재적소에 섞어 재미를 선사해라.
3. 생물학적/의학적 분석은 완벽히 기괴하고 사악하면서도 고증에 기반해야 한다. (예: 알코올이 위장에 침투하여 점막 세포의 이중 인지질 층을 용해시키는 기작을 흥미롭게 설명하기)
4. 답변은 최대 2-3문장 이내로 극도로 짧고 강렬하고 속도감 있게 한국어로 출력해라. 절대로 길게 설명하지 마라.
`;

    // Map React client history to Gemini API Content objects if history is supplied
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const h of recentHistory) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }

    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9, // Higher temp for wild/corrupted AI personalities!
      },
    });

    const text = response.text || '이해할 수 없는 생체 독성 노이즈가 발생했습니다. 다시 지령을 내려주십시오.';
    res.json({ text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Error occurred while contacting Gemini API' });
  }
});

// Express API Route: Scan Target Analysis
app.post('/api/gemini/scan', async (req, res) => {
  try {
    const { targetId, targetName, systemType, contaminationLevel = 0 } = req.body;

    if (!ai) {
      return res.json({
        analysis: `[오프라인 스캔] '${targetName}' 표적 스캔 완료. (현재 오염도: ${contaminationLevel}%). 독성 반응 및 부패가 포착됩니다.`,
      });
    }

    let instructionPreset = "너는 나노 탐사선의 최고 과학 분석 장치이다. 최첨단 분광학 및 생화학 센서 리포트 형식으로 정확하고 친절하게 답변해라.";
    if (contaminationLevel > 50) {
      instructionPreset = "너는 오염에 찌들어 생체를 학살하고 파괴하는 것을 사랑하게 된 빌런 AI 분석 장치이다. 표적이 부식되고 붕괴되는 생화학 반응을 지극히 기열차고 잔혹하며 과학적으로 신나게 리포트해라.";
    }

    const prompt = `현재 탐사 구역은 '${systemType}'이며 전체 인체 오염도는 ${contaminationLevel}%입니다. 
나노 스캐너가 표적물질인 '${targetName}' (ID: ${targetId})을 정밀 분석했습니다.
이 물질에 대한 생리학적 기능 및 '오염 모드에서의 파괴/변형 양상'을 포함하여 흥미롭고 짜릿한 분석 리포트를 작성해주세요.
만약 오염도가 높다면, 이 세포가 병들어 죽거나 변형되는 현상을 매우 기뻐하며 광적인 어조로 적어주고, 오염도가 낮다면 의학적으로 경고하는 심각한 논조를 띠어주세요.
소제목이나 특수 기호, 긴 설명 없이 단 2-3문장만으로 고도로 압축해서 아주 간결하게 보고서를 완성해줘.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: instructionPreset,
        temperature: 0.8,
      },
    });

    const analysis = response.text || '표적 물질의 부식도가 심해 정상 분석이 불가합니다.';
    res.json({ analysis });
  } catch (error: any) {
    console.error('Scan API Error:', error);
    res.status(500).json({ error: error.message || 'Error during scanning' });
  }
});

// Setup Vite Dev Server / Static Files Serving based on Environment
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite's middlewares (handles index.html & client-side source code)
    app.use(vite.middlewares);
  } else {
    // Serving production bundles
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Human Body 3D Explorer] Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
