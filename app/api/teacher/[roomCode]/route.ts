import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionStudents, getMessages } from '@/lib/db';
import { SessionMetadata } from '@/lib/metadata';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const session = getSession(roomCode.toUpperCase());
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const students = getSessionStudents(roomCode.toUpperCase());

    const enriched = students.map(s => {
      const messages = getMessages(s.id);
      const lastMeta: SessionMetadata | null = s.last_metadata
        ? JSON.parse(s.last_metadata)
        : null;

      return {
        id: s.id,
        studentName: s.student_name,
        status: s.status,
        exchangeCount: messages.filter(m => m.role === 'user').length,
        engagementLevel: lastMeta?.engagement_level ?? null,
        disciplinesEngaged: lastMeta?.disciplines_engaged ?? [],
        disciplinesAvoided: lastMeta?.disciplines_avoided ?? [],
        interventionNeeded: lastMeta?.intervention_needed ?? false,
        authenticityFlag: lastMeta?.authenticity_flag ?? 'clean',
        notes: lastMeta?.notes ?? '',
        phase: lastMeta?.phase ?? 'orientation',
        finalScore: s.final_score ? JSON.parse(s.final_score) : null,
      };
    });

    return NextResponse.json({ students: enriched, session });
  } catch (err) {
    console.error('teacher dashboard error:', err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
