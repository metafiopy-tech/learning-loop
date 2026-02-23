import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSession, joinSession } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, studentName } = await req.json();

    if (!roomCode || !studentName) {
      return NextResponse.json({ error: 'Room code and student name are required' }, { status: 400 });
    }

    const session = getSession(roomCode.toUpperCase());
    if (!session) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session has ended' }, { status: 400 });
    }

    const studentSession = joinSession({
      id: uuidv4(),
      roomCode: session.room_code,
      studentName,
    });

    return NextResponse.json({
      studentSessionId: studentSession.id,
      problemText: session.problem_text,
      problemId: session.problem_id,
    });
  } catch (err) {
    console.error('join session error:', err);
    return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
  }
}
