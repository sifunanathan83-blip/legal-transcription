import logger from '../../config/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../config/database.js';
import { LEGAL_FORMATTING, PATTERNS } from '../../utils/constants.js';

export class LegalFormatter {
  constructor() {
    this.speakerLabels = new Map();
    this.pageLineCount = 0;
    this.currentPage = 1;
  }

  /**
   * Format a transcript segment with legal conventions
   */
  formatSegment(segment) {
    let formatted = '';

    // Add speaker label in all caps
    if (segment.speaker_id) {
      const label = this.speakerLabels.get(segment.speaker_id) || 'SPEAKER';
      formatted += `${label}:\n`;
    }

    // Process the text
    let text = segment.text.trim();

    // Add Q/A format for witness testimony
    if (this.isQuestion(text)) {
      formatted += `Q: ${text}\n`;
    } else if (this.isAnswer(text)) {
      formatted += `A: ${text}\n`;
    } else {
      formatted += `${text}\n`;
    }

    // Detect and format objections
    if (this.containsObjection(text)) {
      formatted = this.formatObjection(formatted);
    }

    // Detect procedural markers
    if (this.containsProceduralMarker(text)) {
      formatted = this.formatProceduralMarker(formatted);
    }

    // Add timestamp if provided
    if (segment.start_time_ms !== undefined) {
      const timestamp = this.formatTimestamp(segment.start_time_ms);
      formatted += `${timestamp}\n`;
    }

    return formatted;
  }

  /**
   * Detect if text is a question
   */
  isQuestion(text) {
    return text.trim().endsWith('?');
  }

  /**
   * Detect if text is an answer
   */
  isAnswer(text) {
    const answerPatterns = [
      /^yes|^no|^i (think|believe|understand)/i,
      /^the.*is|^it.*is|^they.*are/i,
    ];
    return answerPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Check if text contains objection
   */
  containsObjection(text) {
    return LEGAL_FORMATTING.OBJECTIONS.some((objection) =>
      text.toLowerCase().includes(objection.toLowerCase())
    );
  }

  /**
   * Format objection with proper structure
   */
  formatObjection(text) {
    // Extract objection type
    const match = text.match(
      /objection[,:]\s*([^.\n]+)/i
    );
    if (!match) return text;

    const objectionType = match[1].trim();
    return `${text.split('\n')[0]}: Objection, ${objectionType}.\n`;
  }

  /**
   * Check if text contains procedural marker
   */
  containsProceduralMarker(text) {
    return LEGAL_FORMATTING.PROCEDURAL_MARKERS.some((marker) =>
      text.toLowerCase().includes(marker.toLowerCase())
    );
  }

  /**
   * Format procedural marker
   */
  formatProceduralMarker(formatted) {
    // Ensure procedural markers are on their own line and in proper format
    return formatted
      .replace(/whereupon/gi, '(Whereupon')
      .replace(/\.\)/, ')\n');
  }

  /**
   * Format timestamp in legal notation
   */
  formatTimestamp(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');
    const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    const period = hours >= 12 ? 'p.m.' : 'a.m.';
    const displayHours = hours > 12 ? hours - 12 : hours || 12;

    return `(Time notation: ${displayHours}:${pad(minutes)}:${pad(seconds)} ${period})`;
  }

  /**
   * Register speaker with label
   */
  registerSpeaker(speakerId, label) {
    this.speakerLabels.set(speakerId, label.toUpperCase());
  }

  /**
   * Format complete transcript for export
   */
  formatCompleteTranscript(segments, metadata) {
    let transcript = '';

    // Add cover page info if provided
    if (metadata) {
      transcript += this.formatCoverPage(metadata);
      transcript += '\n\n';
    }

    // Format each segment
    segments.forEach((segment) => {
      transcript += this.formatSegment(segment);
      transcript += '\n';
    });

    return transcript;
  }

  /**
   * Format cover page
   */
  formatCoverPage(metadata) {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
                          ${metadata.court_name || 'COURT OF RECORD'}
                               ${metadata.jurisdiction || ''}

${metadata.case_name || 'CASE NAME'}

Case Number: ${metadata.case_number || 'N/A'}

--- Deposition Transcript ---

Date: ${metadata.date || today}
Judge: ${metadata.judge || 'Not specified'}

`.trim();
  }

  /**
   * Detect and mark exhibits in text
   */
  markExhibits(text) {
    const exhibitPattern = /exhibit\s+([a-z0-9]+)/gi;
    let marked = text;
    let match;

    while ((match = exhibitPattern.exec(text)) !== null) {
      const exhibitRef = `Exhibit ${match[1].toUpperCase()}`;
      marked = marked.replace(
        match[0],
        `**${exhibitRef}**`
      );
    }

    return marked;
  }

  /**
   * Handle phonetic spellings
   */
  formatPhonetic(word, phonetic) {
    return `${word} [phonetic: ${phonetic}]`;
  }
}

const legalFormatter = new LegalFormatter();
export default legalFormatter;