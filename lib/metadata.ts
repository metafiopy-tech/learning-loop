export type EngagementLevel = 'high' | 'medium' | 'low';
export type SessionPhase = 'orientation' | 'exploration' | 'deepening' | 'synthesis' | 'scoring';

export interface SessionMetadata {
  phase: SessionPhase;
  exchange_number: number;
  engagement_level: EngagementLevel;
  scaffolding_level: 'high' | 'medium' | 'low' | 'verification';
  scaffolding_type: 'conceptual' | 'factual_context' | 'none';
  disciplines_engaged: string[];
  disciplines_avoided: string[];
  student_behavior:
    | 'proposing'
    | 'deferring'
    | 'shallow'
    | 'deep'
    | 'premature_closure'
    | 'authority_deflection'
    | 'novel_reasoning'
    | 'productive_uncertainty'
    | 'guessing'
    | 'ai_dependent'
    | 'suspected_ai_input';
  authenticity_flag: 'clean' | 'probe_triggered' | 'verification_needed';
  intervention_needed: boolean;
  notes: string;

  // Scoring phase only
  final_scores?: {
    reasoning_depth: number;
    disciplinary_breadth: number;
    self_correction: number;
    independence: number;
    overall: number;
  };
  total_exchanges?: number;
  scaffolding_trajectory?: string;
  disciplines_covered?: string[];
  disciplines_missed?: string[];
  strongest_moment?: string;
  growth_area?: string;
}

export interface FinalScore {
  depth: number;
  breadth: number;
  selfCorrection: number;
  independence: number;
  overall: number;
  feedback: string;
  // computed
  weighted_total: number;
  summary: string;
}

/** Strip <metadata> and <score> tags, return clean student text + parsed data */
export function parseResponse(raw: string): {
  studentText: string;
  metadata: SessionMetadata | null;
  finalScore: FinalScore | null;
} {
  const metaMatch = raw.match(/<metadata>([\s\S]*?)<\/metadata>/i);
  const scoreMatch = raw.match(/<score>([\s\S]*?)<\/score>/i);

  let metadata: SessionMetadata | null = null;
  let finalScore: FinalScore | null = null;

  if (metaMatch) {
    try { metadata = JSON.parse(metaMatch[1].trim()); } catch { /* ignore */ }
  }

  if (scoreMatch) {
    try {
      const s = JSON.parse(scoreMatch[1].trim());
      finalScore = {
        ...s,
        weighted_total: Math.round(
          (s.depth ?? 0) * 0.3 +
          (s.breadth ?? 0) * 0.25 +
          (s.selfCorrection ?? 0) * 0.25 +
          (s.independence ?? 0) * 0.2
        ),
        summary: s.feedback ?? '',
      };
    } catch { /* ignore */ }
  }

  const studentText = raw
    .replace(/<metadata>[\s\S]*?<\/metadata>/gi, '')
    .replace(/<score>[\s\S]*?<\/score>/gi, '')
    .trim();

  return { studentText, metadata, finalScore };
}

export function engagementColor(level: EngagementLevel | undefined): string {
  switch (level) {
    case 'high':   return 'green';
    case 'medium': return 'yellow';
    case 'low':    return 'red';
    default:       return 'gray';
  }
}

/** Alias used by claude.ts — returns { text, metadata } */
export function parseMetadata(raw: string): { text: string; metadata: SessionMetadata | null } {
  const { studentText, metadata } = parseResponse(raw);
  return { text: studentText, metadata };
}

export function engagementLabel(level: 'high' | 'medium' | 'low' | undefined): string {
  switch (level) {
    case 'high': return 'Engaged';
    case 'medium': return 'Passive';
    case 'low': return 'Struggling';
    default: return 'Waiting';
  }
}
