'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ScoreResult } from '@/lib/claude';
import { getApiKey } from '@/lib/apiKey';

interface ScoringState {
  finalScores: { reasoning_depth: number; disciplinary_breadth: number; self_correction: number; independence: number; overall: number } | null;
  strongestMoment: string;
  growthArea: string;
  disciplinesCovered: string[];
  disciplinesMissed: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function StudentSession() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [problemText, setProblemText] = useState('');
  const [problemCollapsed, setProblemCollapsed] = useState(false);
  const [studentSessionId, setStudentSessionId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [initError, setInitError] = useState('');
  const [scoringState, setScoringState] = useState<ScoringState>({
    finalScores: null,
    strongestMoment: '',
    growthArea: '',
    disciplinesCovered: [],
    disciplinesMissed: [],
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const isPasted = useRef(false);
  const questionShownAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!getApiKey()) { router.push('/'); return; }
    const sid = sessionStorage.getItem('studentSessionId');
    const name = sessionStorage.getItem('studentName');
    const problem = sessionStorage.getItem('problemText');
    if (!sid || !name || !problem) { router.push('/student'); return; }
    setStudentSessionId(sid);
    setStudentName(name);
    setProblemText(problem);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || !studentSessionId) return;

    const userMsg = input.trim();
    const inputMethod = isPasted.current ? 'pasted' : 'typed';
    const responseTimeSecs = (Date.now() - questionShownAt.current) / 1000;
    isPasted.current = false;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': getApiKey() ?? '' },
        body: JSON.stringify({
          studentSessionId,
          message: userMsg,
          input_method: inputMethod,
          response_time_seconds: Math.round(responseTimeSecs),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        questionShownAt.current = Date.now(); // reset timer when new question arrives
      }
      // Capture scoring metadata BEFORE it's stripped — parse then display
      if (data.metadata?.phase === 'scoring' && data.metadata.final_scores) {
        setScoringState({
          finalScores: data.metadata.final_scores,
          strongestMoment: data.metadata.strongest_moment || '',
          growthArea: data.metadata.growth_area || '',
          disciplinesCovered: data.metadata.disciplines_covered || [],
          disciplinesMissed: data.metadata.disciplines_missed || [],
        });
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    }
    setLoading(false);
  }

  async function endSession() {
    if (!studentSessionId || messages.length < 2) return;
    setScoring(true);
    try {
      // If the conversation already went through a scoring phase, use that data directly
      if (scoringState.finalScores) {
        const fs = scoringState.finalScores;
        setScore({
          depth: fs.reasoning_depth,
          breadth: fs.disciplinary_breadth,
          selfCorrection: fs.self_correction,
          independence: fs.independence,
          overall: fs.overall,
          feedback: [scoringState.strongestMoment, scoringState.growthArea].filter(Boolean).join(' '),
        });
      } else {
        // Fall back to separate scoring API call
        const res = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': getApiKey() ?? '' },
          body: JSON.stringify({ studentSessionId }),
        });
        const data = await res.json();
        setScore(data);
      }
    } catch {
      setScore({
        depth: 0, breadth: 0, selfCorrection: 0, independence: 0, overall: 0,
        feedback: 'Could not generate score. Check your connection.'
      });
    }
    setScoring(false);
  }

  if (initError) return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--red)', marginBottom: '1rem' }}>{initError}</p>
        <button onClick={() => router.push('/student')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
      </div>
    </main>
  );

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '720px', margin: '0 auto', padding: '0 1rem' }}>

      {/* Header */}
      <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Room: </span>
          <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700 }}>{roomCode}</span>
          {studentName && <span style={{ color: 'var(--muted)', fontSize: '0.8rem', marginLeft: '1rem' }}>{studentName}</span>}
        </div>
        <button
          onClick={endSession}
          disabled={messages.length < 2 || scoring}
          style={{
            padding: '0.4rem 1rem',
            background: 'transparent',
            border: `1px solid ${messages.length < 2 ? 'var(--border)' : 'var(--red)'}`,
            color: messages.length < 2 ? 'var(--muted)' : 'var(--red)',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: messages.length < 2 ? 'not-allowed' : 'pointer',
          }}
        >
          {scoring ? 'Scoring...' : 'End Session'}
        </button>
      </div>

      {/* Problem */}
      {problemText && (
        <div style={{ margin: '1rem 0', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
          <button
            onClick={() => setProblemCollapsed(!problemCollapsed)}
            style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <span>📋 The Problem</span>
            <span style={{ color: 'var(--muted)' }}>{problemCollapsed ? '▼ show' : '▲ hide'}</span>
          </button>
          {!problemCollapsed && (
            <div style={{ padding: '0 1rem 1rem', color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {problemText}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 && problemText && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem', fontSize: '0.9rem' }}>
            Read the problem above, then share your initial thoughts below.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              padding: '0.875rem 1.1rem',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--card)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              color: 'var(--text)',
              fontSize: '0.925rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '0.875rem 1.1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', color: 'var(--muted)', fontSize: '0.925rem' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '1rem 0', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onPaste={() => { isPasted.current = true; }}
          placeholder="Share your thinking..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '0.925rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '0.75rem 1.25rem',
            background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Send
        </button>
      </form>

      {/* Score Modal */}
      {score && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '2rem'
        }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Session Complete</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>Here&apos;s how you thought through the problem.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Reasoning Depth', value: score.depth, weight: '30%' },
                { label: 'Disciplinary Breadth', value: score.breadth, weight: '25%' },
                { label: 'Self-Correction', value: score.selfCorrection, weight: '25%' },
                { label: 'Independence', value: score.independence, weight: '20%' },
              ].map(dim => (
                <div key={dim.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.875rem' }}>{dim.label}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600 }}>{dim.value}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${dim.value}%`, background: 'var(--accent)', borderRadius: '3px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>Overall</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{score.overall}</span>
              </div>

              {/* Richer feedback from scoring phase metadata */}
              {scoringState.strongestMoment ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your strongest moment</p>
                    <p style={{ color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.6 }}>{scoringState.strongestMoment}</p>
                  </div>
                  {scoringState.growthArea && (
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Where to push next</p>
                      <p style={{ color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.6 }}>{scoringState.growthArea}</p>
                    </div>
                  )}
                  {scoringState.disciplinesCovered.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disciplines covered</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {scoringState.disciplinesCovered.map(d => (
                          <span key={d} style={{ padding: '0.2rem 0.6rem', background: 'var(--accent)', color: '#fff', borderRadius: '999px', fontSize: '0.75rem' }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {scoringState.disciplinesMissed.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disciplines to explore</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {scoringState.disciplinesMissed.map(d => (
                          <span key={d} style={{ padding: '0.2rem 0.6rem', background: 'var(--border)', color: 'var(--muted)', borderRadius: '999px', fontSize: '0.75rem' }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{score.feedback}</p>
              )}
            </div>

            <button
              onClick={() => router.push('/')}
              style={{ width: '100%', padding: '0.875rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
