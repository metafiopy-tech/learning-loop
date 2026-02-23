'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiKey, setApiKey, clearApiKey } from '@/lib/apiKey';

export default function Home() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [showChange, setShowChange] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setApiKeyState(getApiKey());
    setMounted(true);
  }, []);

  function saveKey(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setKeyError('That doesn\'t look like an Anthropic key (should start with sk-ant-)');
      return;
    }
    setApiKey(trimmed);
    setApiKeyState(trimmed);
    setKeyInput('');
    setKeyError('');
    setShowChange(false);
  }

  function removeKey() {
    clearApiKey();
    setApiKeyState(null);
    setShowChange(false);
  }

  // Don't render until we've read localStorage (avoids flicker)
  if (!mounted) return null;

  // ── API Key Setup Screen ──────────────────────────────────────────────────
  if (!apiKey || showChange) {
    return (
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        gap: '2rem',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔑</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Enter your Anthropic API key
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Learning Loop runs on your own key — nothing is stored on any server.
            Get one at{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              console.anthropic.com
            </a>
            .
          </p>
        </div>

        <form onSubmit={saveKey} style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={keyInput}
            onChange={e => { setKeyInput(e.target.value); setKeyError(''); }}
            autoFocus
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: `1px solid ${keyError ? 'var(--red, #ef4444)' : 'var(--border)'}`,
              background: 'var(--card)',
              color: 'var(--text)',
              fontSize: '0.95rem',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          {keyError && (
            <p style={{ color: 'var(--red, #ef4444)', fontSize: '0.8rem', margin: 0 }}>{keyError}</p>
          )}
          <button
            type="submit"
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Save & Continue
          </button>
          {showChange && (
            <button
              type="button"
              onClick={() => setShowChange(false)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Cancel
            </button>
          )}
        </form>
      </main>
    );
  }

  // ── Normal Home Screen ────────────────────────────────────────────────────
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      gap: '3rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{
          fontSize: '12px',
          letterSpacing: '0.2em',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          marginBottom: '1rem',
          fontWeight: 600,
        }}>
          The Learning Loop
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: '1rem',
          color: 'var(--text)',
        }}>
          A tool that makes thinking unavoidable.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          Real-world problems. Socratic AI. No answers given — only better questions.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/student" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '2rem 3rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          textDecoration: 'none',
          color: 'var(--text)',
          transition: 'border-color 0.2s',
          cursor: 'pointer',
          minWidth: '180px',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <span style={{ fontSize: '2rem' }}>🎓</span>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>I&apos;m a Student</span>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Enter a room code</span>
        </Link>

        <Link href="/teacher" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '2rem 3rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          textDecoration: 'none',
          color: 'var(--text)',
          transition: 'border-color 0.2s',
          cursor: 'pointer',
          minWidth: '180px',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <span style={{ fontSize: '2rem' }}>📋</span>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>I&apos;m a Teacher</span>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Create a session</span>
        </Link>
      </div>

      {/* Key management footer */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          onClick={() => setShowChange(true)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          🔑 Change API key
        </button>
        <span style={{ color: 'var(--border)' }}>·</span>
        <button
          onClick={removeKey}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          Remove key
        </button>
        {process.env.NEXT_PUBLIC_MOCK_MODE === 'true' && (
          <>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>⚡ Mock mode</span>
          </>
        )}
      </div>
    </main>
  );
}
