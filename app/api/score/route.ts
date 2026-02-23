import { NextRequest, NextResponse } from 'next/server';
import { getStudentSession, getMessages, endStudentSession } from '@/lib/db';
import { scoreSession } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { studentSessionId } = await req.json();

    if (!studentSessionId) {
      return NextResponse.json({ error: 'studentSessionId required' }, { status: 400 });
    }

    const studentSession = getStudentSession(studentSessionId);
    if (!studentSession) {
      return NextResponse.json({ error: 'Student session not found' }, { status: 404 });
    }

    const messages = getMessages(studentSessionId).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    if (messages.length < 2) {
      return NextResponse.json({ error: 'Not enough conversation to score' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key') ?? undefined;
    const score = await scoreSession(messages, apiKey);
    endStudentSession(studentSessionId, JSON.stringify(score));

    return NextResponse.json(score);
  } catch (err) {
    console.error('score error:', err);
    return NextResponse.json({ error: 'Failed to score session' }, { status: 500 });
  }
}
