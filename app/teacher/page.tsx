'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_PROBLEMS } from '@/lib/prompts';

export default function TeacherCreate() {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(DEMO_PROBLEMS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const problem = DEMO_PROBLEMS.find(p => p.id === selectedProblem)!;

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: selectedProblem, teacherName: teacherName || 'Teacher' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create'); setLoading(false); return; }
      router.push(`/teacher/${data.roomCode}`);
    } catch {
      setError('Connection error.');
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem' }}>
      <a href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.85rem' }}>← Back</a>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>Create a Session</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Choose a problem and start a room. Students join with the room code.</p>

      <form onSubmit={createSession} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={labelStyle}>Your Name (optional)</label>
          <input
            type="text"
            value={teacherName}
            onChange={e => setTeacherName(e.target.value)}
            placeholder="Teacher"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Select Problem</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {DEMO_PROBLEMS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProblem(p.id)}
                style={{
                  padding: '1rem',
                  background: selectedProblem === p.id ? 'rgba(99,102,241,0.1)' : 'var(--card)',
                  border: `1px solid ${selectedProblem === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  color: 'var(--text)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>{p.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{p.disciplines.join(' · ')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Problem preview */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Problem Preview</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{problem.problem}</p>
        </div>

        {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{
          padding: '0.875rem',
          background: loading ? 'var(--border)' : 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Creating...' : 'Create Session →'}
        </button>
      </form>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  color: 'var(--muted)',
  marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '1rem',
  outline: 'none',
};
