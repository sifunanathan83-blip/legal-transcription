export const LEGAL_FORMATTING = {
  JUDGE: 'THE COURT',
  ATTORNEY: 'ATTORNEY',
  WITNESS: 'WITNESS',
  REPORTER: 'THE REPORTER',
  COUNSEL: 'COUNSEL',

  OBJECTIONS: [
    'Objection, assumes facts not in evidence',
    'Objection, compound question',
    'Objection, vague and ambiguous',
    'Objection, calls for speculation',
    'Objection, hearsay',
    'Objection, improper foundation',
    'Objection, relevance',
    'Objection, best evidence rule',
    'Objection, form of the question',
    'Objection, asked and answered',
  ],

  PROCEDURAL_MARKERS: [
    'Whereupon, a brief recess was taken',
    'Whereupon, the proceeding concluded',
    'Whereupon, the witness was sworn',
    'Whereupon, the jury was excused',
    'Whereupon, the matter was adjourned',
    'Whereupon, the examination concluded',
  ],

  REPORTER_NOTATIONS: [
    '(Pause)',
    '(Brief pause)',
    '(Long pause)',
    '(Inaudible)',
    '(Unintelligible)',
    '(Off the record)',
    '(On the record)',
    '(Simultaneous speaking)',
    '(Speaking)',
    '(Crosstalk)',
  ],

  OBJECTION_RULINGS: ['Sustained', 'Overruled', 'Withdrawn', 'Noted'],

  TIME_FORMAT: 'hh:mm:ss a.m./p.m.',
  TIMESTAMP_INTERVAL_SECONDS: 60,

  PAGE_LENGTH_LINES: 25,
  LINES_PER_PAGE: 25,
  CHARACTERS_PER_LINE: 80,

  EXHIBIT_PREFIX: 'Exhibit',
};

export const TRANSCRIPTION_SERVICES = {
  GOOGLE: 'google',
  AZURE: 'azure',
  MOCK: 'mock',
};

export const SESSION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const SPEAKER_ROLES = {
  JUDGE: 'judge',
  ATTORNEY: 'attorney',
  WITNESS: 'witness',
  REPORTER: 'reporter',
  PLAINTIFF: 'plaintiff',
  DEFENDANT: 'defendant',
  OTHER: 'other',
};

export const CONFIDENCE_LEVELS = {
  VERY_HIGH: { min: 0.95, label: 'Very High' },
  HIGH: { min: 0.85, label: 'High' },
  MEDIUM: { min: 0.75, label: 'Medium' },
  LOW: { min: 0.6, label: 'Low' },
  VERY_LOW: { min: 0, label: 'Very Low' },
};

export const EXPORT_FORMATS = {
  PDF: 'pdf',
  DOCX: 'docx',
  TXT: 'txt',
  JSON: 'json',
};

export const WS_MESSAGE_TYPES = {
  INIT: 'init',
  AUDIO_CHUNK: 'audio_chunk',
  PAUSE: 'pause',
  RESUME: 'resume',
  CORRECTION: 'correction',
  END_SESSION: 'end_session',
  SPEAKER_IDENTIFIED: 'speaker_identified',
  OBJECTION_MARKER: 'objection_marker',
  EXHIBIT_REFERENCE: 'exhibit_reference',

  TRANSCRIPT_SEGMENT: 'transcript_segment',
  SPEAKER_UPDATE: 'speaker_update',
  STATUS_UPDATE: 'status_update',
  ERROR: 'error',
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  TIMESTAMP_UPDATE: 'timestamp_update',
  CONFIDENCE_ALERT: 'confidence_alert',
};

export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  ENCODING: 'LINEAR16',
  CHUNK_SIZE_MS: 100,
};

export const RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const PATTERNS = {
  OBJECTION: /\b(objection|overruled|sustained|withdrawn)\b/gi,
  EXHIBIT: /\b(exhibit|marked|referenced)\s*([A-Z0-9]+)?/gi,
  TIME_NOTATION: /\[\d{1,2}:\d{2}:\d{2}\]/g,
  SPEAKER_LABEL: /^([A-Z\s\.]+?):/m,
  PHONETIC: /\[phonetic:\s*(.+?)\]/gi,
  PROCEDURE_MARKER: /\((Whereupon|The witness|A brief recess|Off the record).+?\)/gi,
};

export const LIMITS = {
  MAX_CASE_NAME_LENGTH: 500,
  MAX_SPEAKER_NAME_LENGTH: 100,
  MAX_TRANSCRIPT_SEGMENT_LENGTH: 10000,
  MAX_CORRECTION_LENGTH: 1000,
  MAX_AUDIO_CHUNK_SIZE: 1048576,
  MAX_SESSION_DURATION_HOURS: 24,
};

export default {
  LEGAL_FORMATTING,
  TRANSCRIPTION_SERVICES,
  SESSION_STATUS,
  SPEAKER_ROLES,
  CONFIDENCE_LEVELS,
  EXPORT_FORMATS,
  WS_MESSAGE_TYPES,
  AUDIO_CONFIG,
  RESPONSE_CODES,
  PATTERNS,
  LIMITS,
};