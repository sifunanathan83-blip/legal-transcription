import logger from '../../config/logger.js';
import { LEGAL_FORMATTING, PATTERNS } from '../../utils/constants.js';

export class ObjectionDetector {
  constructor() {
    this.objectionKeywords = LEGAL_FORMATTING.OBJECTIONS;
    this.rulingKeywords = LEGAL_FORMATTING.OBJECTION_RULINGS;
  }

  /**
   * Detect if text contains an objection
   */
  detectObjection(text) {
    const lowerText = text.toLowerCase();

    for (const objection of this.objectionKeywords) {
      if (lowerText.includes(objection.toLowerCase())) {
        return {
          found: true,
          type: objection,
          confidence: 0.95,
        };
      }
    }

    // Check for generic "objection" keyword
    if (/\bobjection\b/i.test(text)) {
      return {
        found: true,
        type: 'Objection',
        confidence: 0.8,
      };
    }

    return {
      found: false,
      type: null,
      confidence: 0,
    };
  }

  /**
   * Detect if text contains an objection ruling
   */
  detectRuling(text) {
    const lowerText = text.toLowerCase();

    for (const ruling of this.rulingKeywords) {
      if (lowerText.includes(ruling.toLowerCase())) {
        return {
          found: true,
          type: ruling,
          confidence: 0.95,
        };
      }
    }

    return {
      found: false,
      type: null,
      confidence: 0,
    };
  }

  /**
   * Extract objection context (who objected, what was objected to)
   */
  extractContext(text) {
    const lines = text.split('\n');
    const context = {
      objector: null,
      objection: null,
      ruling: null,
      fullText: text,
    };

    // Find speaker (objector)
    const speakerMatch = text.match(/^([A-Z\s.]+):\s*Objection/m);
    if (speakerMatch) {
      context.objector = speakerMatch[1];
    }

    // Extract objection
    const objectionMatch = text.match(/Objection[,:]\s*([^.\n]+)/i);
    if (objectionMatch) {
      context.objection = objectionMatch[1].trim();
    }

    // Check for ruling in following lines
    const nextLine = lines[1];
    if (nextLine) {
      const rulingDetect = this.detectRuling(nextLine);
      if (rulingDetect.found) {
        context.ruling = rulingDetect.type;
      }
    }

    return context;
  }

  /**
   * Tag segments with objection information
   */
  tagSegment(segment) {
    const objection = this.detectObjection(segment.text);
    const ruling = this.detectRuling(segment.text);

    return {
      ...segment,
      is_objection: objection.found,
      objection_type: objection.type,
      objection_confidence: objection.confidence,
      ruling: ruling.type,
      tags: this.generateTags(segment.text, objection, ruling),
    };
  }

  /**
   * Generate semantic tags for segment
   */
  generateTags(text, objection, ruling) {
    const tags = [];

    if (objection.found) {
      tags.push('OBJECTION');
      tags.push(`OBJECTION_${objection.type.replace(/,\s*/g, '_').toUpperCase()}`);
    }

    if (ruling.found) {
      tags.push(`RULING_${ruling.type.toUpperCase()}`);
    }

    // Add procedural tags
    if (LEGAL_FORMATTING.PROCEDURAL_MARKERS.some((marker) =>
      text.toLowerCase().includes(marker.toLowerCase())
    )) {
      tags.push('PROCEDURAL');
    }

    return tags.join(',');
  }

  /**
   * Validate objection pattern
   */
  validatePattern(text) {
    // Valid pattern: "Speaker: Objection, type. THE COURT: Ruling."
    const pattern = /^[A-Z\s.]+:\s*Objection[,.].*?THE COURT:\s*(Sustained|Overruled|Withdrawn|Noted)/is;
    return pattern.test(text);
  }
}

const objectionDetector = new ObjectionDetector();
export default objectionDetector;