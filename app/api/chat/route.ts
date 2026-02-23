import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getStudentSession, getSession, getMessages, saveMessage, updateStudentMetadata } from '@/lib/db';
import { sendSocraticMessage, InputSignals } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { studentSessionId, message, input_method, response_time_seconds } = await req.json();

    if (!studentSessionId || !message?.trim()) {
      return NextResponse.json({ error: 'studentSessionId and message required' }, { status: 400 });
    }

    const studentSession = getStudentSession(studentSessionId);
    if (!studentSession) {
      return NextResponse.json({ error: 'Student session not found' }, { status: 404 });
    }

    const session = getSession(studentSession.room_code);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Save user message
    saveMessage({
      id: uuidv4(),
      studentSessionId,
      role: 'user',
      content: message.trim(),
    });

    // Build conversation history for Claude
    const history = getMessages(studentSessionId).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Get Socratic response
    const signals: InputSignals = {
      inputMethod: input_method === 'pasted' ? 'pasted' : 'typed',
      responseTimeSeconds: typeof response_time_seconds === 'number' ? response_time_seconds : undefined,
    };
    const apiKey = req.headers.get('x-api-key') ?? undefined;
    const { text, metadata } = await sendSocraticMessage(history, session.problem_text, signals, apiKey);

    // Save assistant response
    saveMessage({
      id: uuidv4(),
      studentSessionId,
      role: 'assistant',
      content: text,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    // Update student's last metadata for teacher dashboard
    if (metadata) {
      updateStudentMetadata(studentSessionId, JSON.stringify(metadata));
    }

    return NextResponse.json({ reply: text, metadata });
  } catch (err) {
    console.error('chat error:', err);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
