'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentJoin() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code.toUpperCase(), studentName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to join'); setLoading(false); return; }
      sessionStorage.setItem('studentName', name.trim());
      sessionStorage.setItem('studentSessionId', data.studentSessionId);
      sessionStorage.setItem('problemText', data.problemText);
      sessionStorage.setItem('problemId', data.problemId);
      router.push(`/student/${code.toUpperCase()}`);
    } catch {
      setError('Connection error. Try again.');
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <a href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.85rem' }}>← Back</a>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem' }}>Join a Session</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Enter your name and the room code from your teacher.</p>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First name is fine"
              style={inputStyle}
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Room Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="6-character code"
              maxLength={6}
              style={{ ...inputStyle, letterSpacing: '0.2em', fontFamily: 'monospace', fontSize: '1.1rem' }}
            />
          </div>

          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}

          <button type="submit" disabled={loading || !name.trim() || !code.trim()} style={buttonStyle(loading)}>
            {loading ? 'Joining...' : 'Join Session →'}
          </button>
        </form>
      </div>
    </main>
  );
}

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

const buttonStyle = (loading: boolean): React.CSSProperties => ({
  padding: '0.875rem',
  background: loading ? 'var(--border)' : 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'background 0.2s',
});
