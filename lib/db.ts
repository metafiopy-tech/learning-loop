import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'learning-loop.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      room_code TEXT UNIQUE NOT NULL,
      problem_id TEXT NOT NULL,
      problem_text TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS student_sessions (
      id TEXT PRIMARY KEY,
      room_code TEXT NOT NULL,
      student_name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      final_score TEXT,
      last_metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      student_session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL
    );
  `);
}

// --- Sessions ---

export interface Session {
  id: string;
  room_code: string;
  problem_id: string;
  problem_text: string;
  teacher_name: string;
  created_at: number;
  status: string;
}

export function createSession(params: {
  id: string;
  roomCode: string;
  problemId: string;
  problemText: string;
  teacherName: string;
}): Session {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    INSERT INTO sessions (id, room_code, problem_id, problem_text, teacher_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(params.id, params.roomCode, params.problemId, params.problemText, params.teacherName, now);
  return getSession(params.roomCode)!;
}

export function getSession(roomCode: string): Session | null {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE room_code = ?').get(roomCode) as Session | null;
}

// --- Student Sessions ---

export interface StudentSession {
  id: string;
  room_code: string;
  student_name: string;
  created_at: number;
  status: string;
  final_score: string | null;
  last_metadata: string | null;
}

export function joinSession(params: {
  id: string;
  roomCode: string;
  studentName: string;
}): StudentSession {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    INSERT INTO student_sessions (id, room_code, student_name, created_at)
    VALUES (?, ?, ?, ?)
  `).run(params.id, params.roomCode, params.studentName, now);
  return getStudentSession(params.id)!;
}

export function getStudentSession(id: string): StudentSession | null {
  const db = getDb();
  return db.prepare('SELECT * FROM student_sessions WHERE id = ?').get(id) as StudentSession | null;
}

export function getSessionStudents(roomCode: string): StudentSession[] {
  const db = getDb();
  return db.prepare('SELECT * FROM student_sessions WHERE room_code = ? ORDER BY created_at ASC').all(roomCode) as StudentSession[];
}

export function updateStudentMetadata(id: string, metadata: string) {
  const db = getDb();
  db.prepare('UPDATE student_sessions SET last_metadata = ? WHERE id = ?').run(metadata, id);
}

export function endStudentSession(id: string, finalScore: string) {
  const db = getDb();
  db.prepare('UPDATE student_sessions SET status = ?, final_score = ? WHERE id = ?').run('completed', finalScore, id);
}

// --- Messages ---

export interface Message {
  id: string;
  student_session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: string | null;
  created_at: number;
}

export function saveMessage(params: {
  id: string;
  studentSessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: string;
}): Message {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    INSERT INTO messages (id, student_session_id, role, content, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(params.id, params.studentSessionId, params.role, params.content, params.metadata ?? null, now);
  return { id: params.id, student_session_id: params.studentSessionId, role: params.role, content: params.content, metadata: params.metadata ?? null, created_at: now };
}

export function getMessages(studentSessionId: string): Message[] {
  const db = getDb();
  return db.prepare('SELECT * FROM messages WHERE student_session_id = ? ORDER BY created_at ASC').all(studentSessionId) as Message[];
}
