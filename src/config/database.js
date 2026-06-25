import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from './logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../../legal_transcription.db');

let db = null;

export async function initDatabase() {
  if (db) return db;

  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec('PRAGMA foreign_keys = ON');
    await createTables();

    logger.info(`✅ Database initialized at ${dbPath}`);
    return db;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      case_number TEXT UNIQUE NOT NULL,
      case_name TEXT,
      court_name TEXT,
      judge TEXT,
      jurisdiction TEXT,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS transcription_sessions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      title TEXT,
      status TEXT DEFAULT 'active',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      duration_seconds INTEGER,
      word_count INTEGER DEFAULT 0,
      speaker_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS speakers (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      name TEXT,
      label TEXT,
      role TEXT,
      voice_profile TEXT,
      is_verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES transcription_sessions(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS transcript_segments (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      speaker_id TEXT,
      text TEXT,
      start_time_ms INTEGER,
      end_time_ms INTEGER,
      confidence REAL,
      is_objection BOOLEAN DEFAULT 0,
      is_procedural BOOLEAN DEFAULT 0,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES transcription_sessions(id),
      FOREIGN KEY (speaker_id) REFERENCES speakers(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS exhibits (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exhibit_number TEXT,
      description TEXT,
      file_path TEXT,
      referenced_at_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES transcription_sessions(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS revisions (
      id TEXT PRIMARY KEY,
      segment_id TEXT NOT NULL,
      original_text TEXT,
      corrected_text TEXT,
      reason TEXT,
      corrected_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (segment_id) REFERENCES transcript_segments(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      format TEXT,
      file_path TEXT,
      file_size INTEGER,
      exported_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES transcription_sessions(id)
    )
  `);

  logger.info('✅ Database tables created/verified');
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    logger.info('✅ Database connection closed');
  }
}

export default { initDatabase, getDatabase, closeDatabase };