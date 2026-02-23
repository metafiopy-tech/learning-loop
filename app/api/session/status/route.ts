import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionStudents } from '@/lib/db';

export async function GET(req: NextRequest) {
  const roomCode = req.nextUrl.searchParams.get('roomCode');
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  // Accept either roomCode or sessionId (teacher passes sessionId, we store room_code)
  if (!roomCode && !sessionId) {
    return NextResponse.json({ error: 'roomCode or sessionId required' }, { status: 400 });
  }

  // If sessionId passed, treat it as roomCode (the create route returns roomCode as sessionId alias)
  const code = (roomCode ?? sessionId ?? '').toUpperCase();
  const session = getSession(code);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const students = getSessionStudents(session.room_code);

  const enriched = students.map((s) => ({
    ...s,
    lastMetadata: s.last_metadata ? JSON.parse(s.last_metadata) : null,
    finalScore: s.final_score ? JSON.parse(s.final_score) : null,
  }));

  return NextResponse.json({ session, students: enriched });
}
