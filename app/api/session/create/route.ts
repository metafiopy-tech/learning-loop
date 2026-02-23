import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSession, getSession } from '@/lib/db';
import { DEMO_PROBLEMS } from '@/lib/prompts';

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { problemId, teacherName } = await req.json();

    const problem = DEMO_PROBLEMS.find(p => p.id === problemId);
    if (!problem) {
      return NextResponse.json({ error: 'Invalid problem ID' }, { status: 400 });
    }

    // Generate unique room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (getSession(roomCode) && attempts < 10) {
      roomCode = generateRoomCode();
      attempts++;
    }

    const session = createSession({
      id: uuidv4(),
      roomCode,
      problemId,
      problemText: problem.problem,
      teacherName: teacherName || 'Teacher',
    });

    return NextResponse.json({ roomCode: session.room_code, sessionId: session.id });
  } catch (err) {
    console.error('create session error:', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
