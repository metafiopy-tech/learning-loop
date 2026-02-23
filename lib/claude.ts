import Anthropic from '@anthropic-ai/sdk';
import { SOCRATIC_SYSTEM_PROMPT, SCORING_PROMPT } from './prompts';
import { parseMetadata, SessionMetadata } from './metadata';

const MOCK_MODE = process.env.MOCK_MODE === 'true';
const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

let _client: Anthropic | null = null;
function getClient(apiKey?: string): Anthropic {
  // If a per-request key is provided, create a fresh client for it
  if (apiKey) return new Anthropic({ apiKey });
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MOCK_RESPONSES = [
  `That's an interesting starting point. If you removed the Snake River dams, what do you think would happen to the energy supply for the region — and who would bear that cost?

<metadata>
{
  "phase": "exploration",
  "exchange_number": 2,
  "engagement_level": "medium",
  "disciplines_engaged": ["marine biology"],
  "disciplines_avoided": ["economics", "indigenous rights", "policy"],
  "student_behavior": "proposing",
  "intervention_needed": false,
  "notes": "Student engaged with ecological angle. Push toward economic and political trade-offs."
}
</metadata>`,
  `You're thinking about the immediate ecological fix — that's the right instinct. But let's stress-test it: if salmon populations recover, how long before the orca population actually stabilizes? What happens in the meantime?

<metadata>
{
  "phase": "exploration",
  "exchange_number": 3,
  "engagement_level": "medium",
  "disciplines_engaged": ["marine biology", "ecology"],
  "disciplines_avoided": ["economics", "indigenous rights"],
  "student_behavior": "proposing",
  "intervention_needed": false,
  "notes": "Good ecological reasoning. Needs to engage with timeline and political feasibility."
}
</metadata>`,
  `Good — you're starting to see the trade-offs. Here's the harder question: the Yakama Nation has legally protected fishing rights on the Columbia River that predate Washington statehood. How does your recommendation interact with those rights?

<metadata>
{
  "phase": "deepening",
  "exchange_number": 5,
  "engagement_level": "high",
  "disciplines_engaged": ["marine biology", "economics", "policy"],
  "disciplines_avoided": ["indigenous rights"],
  "student_behavior": "deep",
  "intervention_needed": false,
  "notes": "Student showing strong cross-disciplinary thinking. Push toward indigenous rights — the hardest tension."
}
</metadata>`,
];

let mockIndex = 0;

export interface InputSignals {
  inputMethod?: 'typed' | 'pasted';
  responseTimeSeconds?: number;
}

export async function sendSocraticMessage(
  messages: { role: 'user' | 'assistant'; content: string }[],
  problemText: string,
  signals?: InputSignals,
  apiKey?: string
): Promise<{ text: string; metadata: SessionMetadata | null }> {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 800)); // simulate latency
    const raw = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
    mockIndex++;
    return parseMetadata(raw);
  }

  const client = getClient(apiKey);
  const systemPrompt = `${SOCRATIC_SYSTEM_PROMPT}

============================================================
CURRENT PROBLEM
============================================================
${problemText}`;

  // Attach input signal note to the last user message if signals are present
  let augmentedMessages = [...messages];
  if (signals && augmentedMessages.length > 0) {
    const last = augmentedMessages[augmentedMessages.length - 1];
    if (last.role === 'user') {
      const parts: string[] = [];
      if (signals.inputMethod === 'pasted') parts.push('pasted');
      if (signals.responseTimeSeconds !== undefined) {
        parts.push(`response_time: ${Math.round(signals.responseTimeSeconds)}s`);
      }
      if (parts.length > 0) {
        augmentedMessages = [
          ...augmentedMessages.slice(0, -1),
          { ...last, content: `${last.content}\n\n[INPUT SIGNAL: ${parts.join(' | ')}]` },
        ];
      }
    }
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: augmentedMessages,
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseMetadata(raw);
}

export interface ScoreResult {
  depth: number;
  breadth: number;
  selfCorrection: number;
  independence: number;
  overall: number;
  feedback: string;
}

export async function scoreSession(
  messages: { role: 'user' | 'assistant'; content: string }[],
  apiKey?: string
): Promise<ScoreResult> {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 1200));
    return {
      depth: 72,
      breadth: 58,
      selfCorrection: 81,
      independence: 65,
      overall: 70,
      feedback: "You showed strong reasoning depth and adapted your thinking well when challenged. Your biggest growth area is engaging across more disciplines — you stayed mostly in the ecological frame. Next time, push yourself to consider the economic and political dimensions earlier in your analysis."
    };
  }

  const client = getClient(apiKey);
  const conversationText = messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SCORING_PROMPT,
    messages: [{ role: 'user', content: `Here is the full conversation to evaluate:\n\n${conversationText}` }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
  try {
    return JSON.parse(raw) as ScoreResult;
  } catch {
    return {
      depth: 50, breadth: 50, selfCorrection: 50, independence: 50, overall: 50,
      feedback: "Session complete. Keep pushing your thinking across disciplines."
    };
  }
}
