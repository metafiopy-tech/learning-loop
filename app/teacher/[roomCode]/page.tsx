'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { engagementColor, engagementLabel } from '@/lib/metadata';

interface StudentStatus {
  id: string;
  studentName: string;
  status: string;
  exchangeCount: number;
  engagementLevel: 'high' | 'medium' | 'low' | null;
  disciplinesEngaged: string[];
  disciplinesAvoided: string[];
  interventionNeeded: boolean;
  authenticityFlag: 'clean' | 'probe_triggered' | 'verification_needed';
  notes: string;
  phase: string;
  finalScore: { depth: number; breadth: number; selfCorrection: number; independence: number; overall: number; feedback: string } | null;
}

interface SessionInfo {
  room_code: string;
  problem_id: string;
  teacher_name: string;
  status: string;
}

export default function TeacherDashboard() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/${roomCode}`);
      const data = await res.json();
      if (data.students) setStudents(data.students);
      if (data.session) setSession(data.session);
    } catch { /* silent */ }
    setLoading(false);
  }, [roomCode]);

  useEffect(() => {
    fetchStudents();
    const interval = setInterval(fetchStudents, 5000);
    return () => clearInterval(interval);
  }, [fetchStudents]);

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <a href="/teacher" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.85rem' }}>← New Session</a>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>
            {session?.problem_id?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Live Dashboard'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {session?.teacher_name} · Auto-refreshing every 5s
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Share this code with students</div>
          <button onClick={copyCode} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1rem',
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px',
            cursor: 'pointer', color: 'var(--text)',
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.15em' }}>{roomCode}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{copied ? '✓ copied' : 'copy'}</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[['high', 'Engaged'], ['medium', 'Passive'], ['low', 'Struggling']].map(([level, label]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: engagementColor(level as 'high' | 'medium' | 'low') }} />
            {label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f97316' }} />
          Authenticity check
        </div>
      </div>

      {/* Students grid */}
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: '12px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: 'var(--muted)' }}>Waiting for students to join with code <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 700 }}>{roomCode}</span></p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {students.map(student => (
            <div
              key={student.id}
              onClick={() => setExpanded(expanded === student.id ? null : student.id)}
              style={{
                background: 'var(--card)',
                border: `1px solid ${
                  student.authenticityFlag === 'verification_needed' ? '#f97316'
                  : student.interventionNeeded ? 'var(--red)'
                  : 'var(--border)'
                }`,
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{student.studentName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem', textTransform: 'capitalize' }}>{student.phase}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: engagementColor(student.engagementLevel ?? undefined), flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{engagementLabel(student.engagementLevel ?? undefined)}</span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{student.exchangeCount}</span> exchanges
                </div>
                {student.finalScore && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    Score: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{student.finalScore.overall}</span>
                  </div>
                )}
              </div>

              {/* Disciplines */}
              {student.disciplinesEngaged.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {student.disciplinesEngaged.map(d => (
                    <span key={d} style={{ padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', borderRadius: '4px', fontSize: '0.7rem' }}>{d}</span>
                  ))}
                </div>
              )}

              {/* Notes */}
              {student.notes && (
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>{student.notes}</p>
              )}

              {/* Intervention flag */}
              {student.interventionNeeded && (
                <div style={{ marginTop: '0.75rem', padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--red)' }}>
                  ⚠ Needs intervention
                </div>
              )}

              {/* Authenticity flags */}
              {student.authenticityFlag === 'verification_needed' && (
                <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'rgba(249,115,22,0.1)', border: '1px solid #f97316', borderRadius: '6px', fontSize: '0.75rem', color: '#f97316' }}>
                  📋 Authenticity check needed
                </div>
              )}
              {student.authenticityFlag === 'probe_triggered' && (
                <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.4)', borderRadius: '6px', fontSize: '0.75rem', color: '#f97316' }}>
                  🔍 Probing authenticity
                </div>
              )}

              {/* Expand indicator */}
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'right' }}>
                {expanded === student.id ? '▲ collapse' : '▼ details'}
              </div>

              {/* Expanded score */}
              {expanded === student.id && student.finalScore && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  {[
                    ['Depth', student.finalScore.depth],
                    ['Breadth', student.finalScore.breadth],
                    ['Self-Correction', student.finalScore.selfCorrection],
                    ['Independence', student.finalScore.independence],
                  ].map(([label, val]) => (
                    <div key={label as string} style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--muted)' }}>{label}</span>
                        <span style={{ color: 'var(--accent)' }}>{val}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${val}%`, background: 'var(--accent)', borderRadius: '2px' }} />
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>{student.finalScore.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
